import Booking from "../models/booking.model.js";

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
