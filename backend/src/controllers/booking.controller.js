import Booking from "../models/booking.model.js";
import EmergencyRequest from "../models/emergencyrequest.model.js";
import { getIO } from "../sockets/socket.js";

export const createBooking = async (req, res) => {
    try {
        const { pickupLocation, dropoffLocation, ambulanceType, needs, distanceKm } = req.body;

        let baseRate = 100; // BASIC
        if (ambulanceType === "OXYGEN") baseRate = 150;
        if (ambulanceType === "ICU") baseRate = 250;
        if (ambulanceType === "PREGNANT") baseRate = 200;

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
            location: { latitude: pickupLocation.latitude, longitude: pickupLocation.longitude },
            requestType: "BOOKING"
        });

        // Link the emergency request to the booking
        booking.requestId = emergencyReq._id;
        await booking.save();

        // Fetch and populate for the socket emit
        const populatedEmergencyReq = await EmergencyRequest.findById(emergencyReq._id)
            .populate("user", "name mobile email address city");

        // Emit to all ambulances
        const io = getIO();
        io.to("ambulance").emit("new_emergency_request", populatedEmergencyReq);

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
        const userId = req.user._id;

        // Fetch regular bookings
        const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });

        // Fetch emergency requests that are NOT linked to bookings (standalone emergencies)
        // and only show those that are PENDING or ACCEPTED
        const standaloneEmergencies = await EmergencyRequest.find({
            user: userId,
            requestType: "EMERGENCY",
            status: { $in: ["PENDING", "AMBULANCE_ACCEPTED"] }
        }).sort({ createdAt: -1 });

        // Transform emergencies to match booking-like structure for the UI
        const transformedEmergencies = standaloneEmergencies.map(err => ({
            _id: err._id,
            requestId: err._id,
            status: err.status === "AMBULANCE_ACCEPTED" ? "ACCEPTED" : err.status,
            ambulanceType: "EMERGENCY",
            pickupLocation: { address: "Live Emergency Location" },
            estimatedPrice: 0,
            createdAt: err.createdAt,
            isEmergency: true
        }));

        // Combine and sort by date
        const combined = [...bookings, ...transformedEmergencies].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.status(200).json({
            success: true,
            data: combined,
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
