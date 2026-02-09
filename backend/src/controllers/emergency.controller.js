import emergencyRequestSchema from "../models/emergencyrequest.model.js";
import { getIO } from "../sockets/socket.js";

export const createEmergencyRequest = async (req, res) => {
  try {
    const { latitude, longitude, imageUrl } = req.body;

    // 1️⃣ Create request
    const request = await emergencyRequestSchema.create({
      user: req.user._id,
      imageUrl,
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
