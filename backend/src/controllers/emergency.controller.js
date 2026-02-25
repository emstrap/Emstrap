import emergencyRequestSchema from "../models/emergencyrequest.model.js";
import { getIO } from "../sockets/socket.js";

export const createEmergencyRequest = async (req, res) => {
  try {
    const { latitude, longitude, imageUrl } = req.body;

    // 1️⃣ Create request
    const request = await emergencyRequestSchema.create({
      user: req.user?._id || undefined,
      imageUrl: imageUrl || "",
      location: { latitude, longitude },
    });

    // 2️⃣ Emit to all ambulances
    const io = getIO();

    io.to("ambulance").emit("new_emergency_request", request);

    res.status(201).json({
      success: true,
      data: request,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const acceptEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's already accepted to prevent race conditions
    const existingRequest = await emergencyRequestSchema.findById(id);
    if (!existingRequest) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (existingRequest.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Emergency is already handled by another driver" });
    }

    const request = await emergencyRequestSchema.findByIdAndUpdate(
      id,
      { status: "AMBULANCE_ACCEPTED", ambulance: req.user._id },
      { new: true }
    );

    const io = getIO();
    // Notify the user tracking the request
    io.to(`request_${id}`).emit("ambulance_assigned", {
      eta: "5 mins", // static for demo
      driverName: req.user.name || "Default Driver",
      vehicleNumber: "KA-01-AB-1234",
    });

    // Notify Hospitals & Police
    io.to("hospital").emit("hospital_alert", { request });
    io.to("police").emit("police_alert", { request });

    // Broadcast that this emergency has been accepted so other drivers' dashboards drop it
    io.to("ambulance").emit("emergency_accepted", { requestId: id });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const declineEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await emergencyRequestSchema.findByIdAndUpdate(
      id,
      { $addToSet: { declinedBy: req.user._id } },
      { new: true }
    );

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDriverHistory = async (req, res) => {
  try {
    const driverId = req.user._id;

    // Time 1 minute ago
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

    // 1. New/Ongoing Requests within 1 minute that this driver hasn't declined
    const ongoing = await emergencyRequestSchema.find({
      status: "PENDING",
      createdAt: { $gte: oneMinuteAgo },
      declinedBy: { $ne: driverId }
    }).sort({ createdAt: -1 });

    // 2. Accepted Requests by this driver
    const accepted = await emergencyRequestSchema.find({
      ambulance: driverId,
      status: { $in: ["AMBULANCE_ACCEPTED", "COMPLETED"] }
    }).sort({ updatedAt: -1 });

    // 3. Rejected Requests by this driver
    const rejected = await emergencyRequestSchema.find({
      declinedBy: driverId
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ongoing,
        accepted,
        rejected
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
