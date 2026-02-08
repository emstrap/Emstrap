const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema(
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmergencyRequest",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ambulance", ambulanceSchema);
