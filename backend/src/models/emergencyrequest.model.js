import { Schema, model } from 'mongoose';

const emergencyRequestSchema = new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
  
      imageUrl: {
        type: String, // Cloudinary URL
        required: true,
      },
  
      location: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
  
      status: {
        type: String,
        enum: [
          "PENDING",
          "AMBULANCE_ACCEPTED",
          "HOSPITAL_PENDING",
          "HOSPITAL_APPROVED",
          "COMPLETED",
          "CANCELLED",
        ],
        default: "PENDING",
      },
  
      ambulance: {
        type: Schema.Types.ObjectId,
        ref: "Ambulance",
        default: null,
      },
  
      hospital: {
        type: Schema.Types.ObjectId,
        ref: "Hospital",
        default: null,
      },
  
      rejectionHistory: [
        {
          hospital: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
          },
          rejectedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    { timestamps: true }
  );
  
  export default model("EmergencyRequest", emergencyRequestSchema);