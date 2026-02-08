import { Schema, model } from "mongoose";

const ambulanceSchema = new Schema(
  {
    driverName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
    },

    role: {
      type: String,
      default: "ambulance",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    currentLocation: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
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
