import mongoose from "mongoose";

const emergencyRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    imageUrl: {
      type: String, // Cloudinary URL
      required: true,
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
      ref: "Ambulance",
      default: null,
    }
  },
  { timestamps: true }
);

const EmergencyRequest = mongoose.model(
  "EmergencyRequest",
  emergencyRequestSchema
)
export default EmergencyRequest;
