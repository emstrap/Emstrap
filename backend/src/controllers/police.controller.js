import Emergency from "../models/emergencyrequest.model.js";

// Fetch Active System Emergencies for Police Command Center
export const getActiveEmergencies = async (req, res) => {
    try {
        const query = {
            status: { $in: ["PENDING", "AMBULANCE_ACCEPTED"] }
        };

        // If the user is a standard police station (field unit), restrict to 24h recent cases.
        // If they are police_hq, let them see everything.
        if (req.user.role === "police") {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            query.createdAt = { $gte: oneDayAgo };
        }

        const emergencies = await Emergency.find(query)
        .populate("user", "name mobile")
        .populate("ambulance", "driverName vehicleNumber phone")
        .sort({ createdAt: -1 });

        res.status(200).json({ success: true, emergencies });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching emergencies", error: error.message });
    }
};
