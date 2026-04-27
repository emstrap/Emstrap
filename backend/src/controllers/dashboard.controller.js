import Emergency from "../models/emergencyrequest.model.js";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";

export const getAlerts = async (req, res) => {
  try {
    const alerts = await Emergency.find({ requestType: "EMERGENCY" })
      .populate("user", "name email mobile city")
      .populate("ambulance", "name email mobile vehicleNumber")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching alerts", error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const [totalAlerts, activeAlerts, totalHospitals, totalBookings, totalUsers, totalAmbulanceDrivers, totalPolice] = await Promise.all([
      Emergency.countDocuments(),
      Emergency.countDocuments({ status: { $in: ["PENDING", "AMBULANCE_ACCEPTED"] } }),
      User.countDocuments({ role: 'hospital' }),
      Booking.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: 'ambulance_driver' }),
      User.countDocuments({ role: { $in: ['police', 'police_hq'] } }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalAlerts,
        activeAlerts,
        totalHospitals,
        totalBookings,
        totalUsers,
        totalAmbulances: totalAmbulanceDrivers,
        totalPolice,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching stats", error: error.message });
  }
};

export const getOverviewStats = async (req, res) => {
  try {
    const [users, bookings, hospitals, emergencies, liveAmbulances, police] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments({ role: 'hospital' }),
      Emergency.countDocuments(),
      User.countDocuments({ role: 'ambulance_driver', driverStatus: "LIVE" }),
      User.countDocuments({ role: { $in: ['police', 'police_hq'] } }),
    ]);

    return res.status(200).json({
      users,
      bookings,
      hospitals,
      emergencies,
      liveAmbulances,
      police,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching overview stats", error: error.message });
  }
};
export const updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["PENDING", "AMBULANCE_ACCEPTED", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updated = await Emergency.findByIdAndUpdate(id, { status }, { new: true })
      .populate("user", "name email mobile city")
      .populate("ambulance", "name email mobile vehicleNumber");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Emergency not found" });
    }

    return res.status(200).json({ success: true, message: "Status updated", emergency: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error updating status", error: error.message });
  }
};
