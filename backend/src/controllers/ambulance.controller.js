import Ambulance from "../models/ambulance.model.js";
import EmergencyRequest from "../models/emergencyrequest.model.js";
import { getIO } from "../sockets/socket.js";

export const acceptEmergencyRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    // 1️⃣ Lock emergency request atomically
    const request = await EmergencyRequest.findOneAndUpdate(
      { _id: requestId, status: "PENDING" },
      {
        status: "AMBULANCE_ACCEPTED",
        ambulance: req.user._id,
      },
      { new: true }
    );

    if (!request) {
      return res.status(400).json({
        message: "Request already accepted",
      });
    }

    // 2️⃣ Lock ambulance atomically
    const ambulance = await Ambulance.findOneAndUpdate(
      { _id: req.user._id, isOnTrip: false },
      { isOnTrip: true },
      { new: true }
    );

    if (!ambulance) {
      return res.status(400).json({
        message: "Already on trip",
      });
    }

    // 3️⃣ Emit real-time updates
    const io = getIO();

    io.to("ambulance").emit("remove_emergency", requestId);
    io.to(request.user.toString()).emit("ambulance_assigned", request);

    res.status(200).json(request);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
