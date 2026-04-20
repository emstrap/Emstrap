import mongoose from "mongoose";

const emergencyRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for anonymous 1-click emergency
    },

    imageUrl: {
      type: String, // Cloudinary URL
      required: false, // Making this optional for now, standard bookings might not have images
    },

    location: {
      latitude: Number,
      longitude: Number,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "AMBULANCE_ACCEPTED",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "PENDING",
    },

    ambulance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    declinedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    requestType: {
      type: String,
      enum: ["EMERGENCY", "BOOKING"],
      default: "EMERGENCY",
    },
  },
  { timestamps: true }
);

const EmergencyRequest = mongoose.model(
  "EmergencyRequest",
  emergencyRequestSchema
)
export default EmergencyRequest;
