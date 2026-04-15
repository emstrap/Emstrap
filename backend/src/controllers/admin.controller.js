import User from "../models/user.model.js";
import Emergency from "../models/emergencyrequest.model.js";

// Get overall system metrics
export const getSystemMetrics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalDrivers = await User.countDocuments({ role: { $in: ["ambulance", "ambulance_driver"] } });
        const totalEmergencies = await Emergency.countDocuments();
        const activeEmergencies = await Emergency.countDocuments({ status: { $in: ["PENDING", "AMBULANCE_ACCEPTED"] } });

        res.status(200).json({
            success: true,
            metrics: {
                totalUsers,
                totalDrivers,
                totalEmergencies,
                activeEmergencies
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching metrics", error: error.message });
    }
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.status(200).json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
    }
};

// Update User Role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const validRoles = ["user", "ambulance", "admin", "police", "hospital"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role specified" });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "User role updated successfully", user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating user role", error: error.message });
    }
};

// Get all emergencies
export const getAllEmergencies = async (req, res) => {
    try {
        const emergencies = await Emergency.find()
            .populate("user", "name email mobile")
            .populate("ambulance", "driverName phone vehicleNumber")
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, emergencies });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching emergencies", error: error.message });
    }
};
