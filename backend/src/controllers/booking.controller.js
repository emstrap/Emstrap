import Booking from "../models/booking.model.js";
import EmergencyRequest from "../models/emergencyrequest.model.js";
import { getIO } from "../sockets/socket.js";

export const createBooking = async (req, res) => {
    try {
        const { pickupLocation, dropoffLocation, ambulanceType, needs, distanceKm } = req.body;

        let baseRate = 100; // BASIC
        if (ambulanceType === "OXYGEN") baseRate = 150;
        if (ambulanceType === "ICU") baseRate = 200;

        const estimatedPrice = distanceKm ? parseFloat((distanceKm * baseRate).toFixed(2)) : 500;

        const booking = await Booking.create({
            user: req.user._id,
            pickupLocation,
            dropoffLocation,
            ambulanceType,
            needs,
            distanceKm,
            estimatedPrice
        });

        // Create an equivalent EmergencyRequest so ambulance drivers receive it in their dashboard
        const emergencyReq = await EmergencyRequest.create({
            user: req.user._id,
            location: { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude }
        });

        // Emit to all ambulances
        const io = getIO();
        io.to("ambulance").emit("new_emergency_request", emergencyReq);

        res.status(201).json({
            success: true,
            data: booking,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getBookings = async (req, res) => {
    try {
        const query = req.user.role === "user" ? { user: req.user._id } : {};

        // Ambulances could fetch their assigned bookings, Hospitals see bookings heading to them
        const bookings = await Booking.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bookings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // Only the owner, an ambulance driver, or an admin can cancel
        const isOwner = booking.user.toString() === req.user._id.toString();
        const isDriver = ["ambulance", "ambulance_driver"].includes(req.user.role);
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isDriver && !isAdmin) {
            return res.status(403).json({ success: false, message: "Not authorized to cancel this booking" });
        }

        booking.status = "CANCELLED";
        await booking.save();

        // Also try to cancel any related EmergencyRequest
        await EmergencyRequest.findOneAndUpdate(
            { user: booking.user, status: "PENDING" }, // Simplistic lookup
            { status: "CANCELLED" }
        );

        const io = getIO();
        io.to(`request_${id}`).emit("booking_cancelled", { bookingId: id });
        io.to("ambulance").emit("emergency_cancelled", { requestId: id }); // Notify ambulances to remove from dashboard

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
