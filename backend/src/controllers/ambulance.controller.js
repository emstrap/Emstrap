import Ambulance from "../models/ambulance.model.js";
import EmergencyRequest from "../models/emergencyrequest.model.js";
import { getIO } from "../sockets/socket.js";

const ambulanceStatuses = ["AVAILABLE", "BUSY", "OFFLINE", "MAINTENANCE"];

const validateAmbulancePayload = (payload, isPartial = false) => {
  const requiredFields = ["driverName", "vehicleNumber", "contact", "location"];

  for (const field of requiredFields) {
    if (!isPartial && !String(payload[field] || "").trim()) {
      return `${field} is required`;
    }
  }

  if (payload.status && !ambulanceStatuses.includes(payload.status)) {
    return "Invalid ambulance status";
  }

  return null;
};

export const getAmbulances = async (req, res) => {
  try {
    const ambulances = await Ambulance.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, ambulances });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching ambulances", error: error.message });
  }
};

export const getAmbulanceById = async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);

    if (!ambulance) {
      return res.status(404).json({ success: false, message: "Ambulance not found" });
    }

    return res.status(200).json({ success: true, ambulance });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching ambulance", error: error.message });
  }
};

export const createAmbulance = async (req, res) => {
  try {
    const validationError = validateAmbulancePayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const ambulance = await Ambulance.create({
      driverName: req.body.driverName,
      vehicleNumber: req.body.vehicleNumber,
      contact: req.body.contact,
      location: req.body.location,
      status: req.body.status || "AVAILABLE",
    });

    return res.status(201).json({ success: true, message: "Ambulance created successfully", ambulance });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "An ambulance with this vehicle number already exists" });
    }

    return res.status(500).json({ success: false, message: "Error creating ambulance", error: error.message });
  }
};

export const updateAmbulance = async (req, res) => {
  try {
    const validationError = validateAmbulancePayload(req.body, true);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const updatePayload = {};
    for (const field of ["driverName", "vehicleNumber", "contact", "location", "status"]) {
      if (typeof req.body[field] !== "undefined") {
        updatePayload[field] = req.body[field];
      }
    }

    const ambulance = await Ambulance.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!ambulance) {
      return res.status(404).json({ success: false, message: "Ambulance not found" });
    }

    return res.status(200).json({ success: true, message: "Ambulance updated successfully", ambulance });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "An ambulance with this vehicle number already exists" });
    }

    return res.status(500).json({ success: false, message: "Error updating ambulance", error: error.message });
  }
};

export const deleteAmbulance = async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndDelete(req.params.id);

    if (!ambulance) {
      return res.status(404).json({ success: false, message: "Ambulance not found" });
    }

    return res.status(200).json({ success: true, message: "Ambulance deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error deleting ambulance", error: error.message });
  }
};

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
