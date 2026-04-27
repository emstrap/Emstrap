import emergencyRequestSchema from "../models/emergencyrequest.model.js";
import User from "../models/user.model.js";
import { getIO } from "../sockets/socket.js";
import cloudinary from "../config/cloudinary.js";
import Booking from "../models/booking.model.js";

export const assignHospital = async (req, res) => {
  try {
    const { id } = req.params;
    const { hospitalId } = req.body;

    if (!hospitalId) {
      return res.status(400).json({ success: false, message: "hospitalId is required" });
    }

    const hospital = await User.findOne({ _id: hospitalId, role: 'hospital' });
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found" });
    }

    const existing = await emergencyRequestSchema.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Emergency request not found" });
    }
    if (existing.ambulance?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the assigned driver can select a hospital" });
    }

    if (existing.requestType !== "EMERGENCY") {
      return res.status(400).json({ success: false, message: "Hospital assignment is only allowed for emergency requests" });
    }

    const updated = await emergencyRequestSchema.findByIdAndUpdate(
      id,
      { hospital: hospitalId, status: "AMBULANCE_ACCEPTED" },
      { new: true }
    )
      .populate("user", "name mobile email address city")
      .populate("ambulance", "name email mobile vehicleNumber")
      .populate("hospital", "name address city mobile email");

    const io = getIO();

    // Notify the specific hospital room and all police
    io.to("hospital").emit("hospital_alert", { request: updated, hospitalSelected: true });
    io.to("police").emit("police_new_case", { request: updated, hospitalSelected: true });
    io.to("police").emit("police_alert", { request: updated });

    // Also update the user tracking the request
    io.to(`request_${id}`).emit("ambulance_assigned", {
      driverName: req.user.name || "Driver",
      driverMobile: req.user.mobile || "",
      vehicleNumber: req.user.vehicleNumber || "",
      hospitalName: updated.hospital?.name || "Assigning...",
      hospitalLocation: updated.hospital ? `${updated.hospital.address}, ${updated.hospital.city}` : "N/A",
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmergencyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await emergencyRequestSchema.findById(id)
      .populate("user", "name mobile email address city")
      .populate("ambulance", "name email mobile vehicleNumber currentLocation")
      .populate("hospital", "name address city mobile email");

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmergencyRequest = async (req, res) => {
  try {
    const { latitude, longitude, imageUrl } = req.body;
    console.log("Creating emergency request. imageUrl present:", !!imageUrl);

    let secureImageUrl = "";
    if (imageUrl) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
          folder: "emergencies",
        });
        secureImageUrl = uploadResponse.secure_url;
        console.log("Cloudinary upload successful:", secureImageUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload failed:", uploadError);
      }
    }

    // 1️⃣ Create request
    const request = await emergencyRequestSchema.create({
      user: req.user?._id || undefined,
      imageUrl: secureImageUrl || "",
      location: { latitude, longitude },
      requestType: "EMERGENCY",
    });

    // 2️⃣ Populate user details for downstream consumers (hospital, police)
    const populatedRequest = await emergencyRequestSchema
      .findById(request._id)
      .populate("user", "name mobile email address city");

    // 3️⃣ Emit to all ambulances, hospitals, and police
    const io = getIO();
    io.to("ambulance").emit("new_emergency_request", populatedRequest);
    io.to("hospital").emit("hospital_alert", { request: populatedRequest });
    io.to("police").emit("police_new_case", { request: populatedRequest });

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

    // Security layer: Check if driver already has an active assigned emergency
    const activeDriverEmergency = await emergencyRequestSchema.findOne({
      ambulance: req.user._id,
      status: "AMBULANCE_ACCEPTED"
    });
    
    if (activeDriverEmergency) {
      return res.status(400).json({ 
        success: false, 
        message: "You are already handling an active emergency. Please complete or cancel it before accepting a new one." 
      });
    }

    // Find nearest hospital only for EMERGENCY type
    let hospitalId = null;
    if (existingRequest.requestType === "EMERGENCY") {
      const nearestHospital = await User.findOne({ role: 'hospital' });
      hospitalId = nearestHospital ? nearestHospital._id : null;
    }

    const request = await emergencyRequestSchema.findByIdAndUpdate(
      id,
      { 
        status: "AMBULANCE_ACCEPTED", 
        ambulance: req.user._id,
        hospital: hospitalId
      },
      { new: true }
    ).populate("user", "name mobile email address city")
     .populate("ambulance", "name email mobile vehicleNumber")
     .populate("hospital", "name address city mobile email");

    // Update related booking if it's a regular booking request
    if (request.requestType === "BOOKING") {
      await Booking.findOneAndUpdate(
        { requestId: id },
        { status: "ACCEPTED", ambulance: req.user._id }
      );
    }

    const io = getIO();
    // Notify the user tracking the request
    io.to(`request_${id}`).emit("ambulance_assigned", {
      eta: "Calculating...", // or some other more dynamic placeholder if you don't have real ETA
      driverName: req.user.name || "Driver",
      driverMobile: req.user.mobile || "",
      vehicleNumber: req.user.vehicleNumber || "",
      hospitalName: request.hospital?.name || "Assigning...",
      hospitalLocation: request.hospital ? `${request.hospital.address}, ${request.hospital.city}` : "N/A",
    });

    // Notify user's personal room for dashboard refresh
    if (request.user) {
      const userIdStr = request.user._id ? request.user._id.toString() : request.user.toString();
      io.to(`user_${userIdStr}`).emit("ambulance_assigned", { requestId: id, status: "ACCEPTED" });
    }

    // Notify Hospitals & Police only for EMERGENCY type
    if (request.requestType === "EMERGENCY") {
      io.to("hospital").emit("hospital_alert", { request });
      io.to("police").emit("police_new_case", { request });
      io.to("police").emit("police_alert", { request });
    }

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

export const cancelEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await emergencyRequestSchema.findByIdAndUpdate(
      id,
      { status: "CANCELLED" },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const io = getIO();
    // Notify driver tracking the request that user cancelled
    io.to(`request_${id}`).emit("emergency_cancelled", { requestId: id });

    // Notify user's personal room for dashboard refresh
    if (request.user) {
      const userIdStr = request.user._id ? request.user._id.toString() : request.user.toString();
      io.to(`user_${userIdStr}`).emit("emergency_cancelled", { requestId: id, status: "CANCELLED" });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await emergencyRequestSchema.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.ambulance?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the assigned driver can complete this request" });
    }

    request.status = "COMPLETED";
    await request.save();

    // Clear activeRequest from the driver
    await User.findByIdAndUpdate(req.user._id, { 
      activeRequest: null,
      isOnTrip: false 
    });

    // Update related booking if it exists
    if (request.requestType === "BOOKING") {
      await Booking.findOneAndUpdate(
        { requestId: id },
        { status: "COMPLETED" }
      );
    }

    const io = getIO();
    // Notify the user tracking the request
    io.to(`request_${id}`).emit("trip_completed", { requestId: id });

    // Notify user's personal room for dashboard refresh
    if (request.user) {
      const userIdStr = request.user._id ? request.user._id.toString() : request.user.toString();
      io.to(`user_${userIdStr}`).emit("trip_completed", { requestId: id, status: "COMPLETED" });
    }

    res.status(200).json({ success: true, message: "Trip completed successfully", data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDriverHistory = async (req, res) => {
  try {
    const driverId = req.user._id;

    const filter = req.query.filter || "24h";

    // Time 30 minutes ago for ongoing (increased from 1 min to allow seeing bookings)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // 1. New/Ongoing Requests within 1 minute that this driver hasn't declined
    // Only fetch if driver is LIVE
    let ongoing = [];
    if (req.user.driverStatus === "LIVE") {
      ongoing = await emergencyRequestSchema.find({
        status: "PENDING",
        createdAt: { $gte: thirtyMinutesAgo },
        declinedBy: { $ne: driverId }
      }).sort({ createdAt: -1 });
    }

    let acceptedQuery = {
      ambulance: driverId,
      status: { $in: ["AMBULANCE_ACCEPTED", "COMPLETED"] }
    };

    let rejectedQuery = {
      declinedBy: driverId
    };

    let cancelledQuery = {
      ambulance: driverId,
      status: "CANCELLED"
    };

    if (filter === "24h") {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      acceptedQuery.updatedAt = { $gte: oneDayAgo };
      rejectedQuery.updatedAt = { $gte: oneDayAgo };
      cancelledQuery.updatedAt = { $gte: oneDayAgo };
    }

    // 2. Accepted Requests by this driver
    const accepted = await emergencyRequestSchema.find(acceptedQuery).sort({ updatedAt: -1 });

    // 3. Rejected Requests by this driver
    const rejected = await emergencyRequestSchema.find(rejectedQuery).sort({ updatedAt: -1 });

    // 4. Cancelled Requests by user
    const cancelled = await emergencyRequestSchema.find(cancelledQuery).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ongoing,
        accepted,
        rejected,
        cancelled
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
