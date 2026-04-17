import { Schema, model } from "mongoose";

const ambulanceSchema = new Schema(
  {
    driverName: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["AVAILABLE", "BUSY", "OFFLINE", "MAINTENANCE"],
      default: "AVAILABLE",
    },

    currentLocation: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },

    isOnTrip: {
      type: Boolean,
      default: false,
    },

    activeRequest: {
      type: Schema.Types.ObjectId,
      ref: "EmergencyRequest",
      default: null,
    },
  },
  { timestamps: true }
);

export default model("Ambulance", ambulanceSchema);
