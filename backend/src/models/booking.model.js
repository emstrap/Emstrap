import { Schema, model } from "mongoose";

const bookingSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        pickupLocation: {
            latitude: Number,
            longitude: Number,
            address: String
        },
        dropoffLocation: {
            latitude: Number,
            longitude: Number,
            address: String
        },
        hospital: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: false,
        },
        ambulanceType: {
            type: String,
            enum: ["BASIC", "OXYGEN", "ICU"],
            default: "BASIC"
        },
        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },
        ambulance: {
            type: Schema.Types.ObjectId,
            ref: "Ambulance",
            default: null,
        },
        estimatedPrice: {
            type: Number,
            default: 0
        },
        distanceKm: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

export default model("Booking", bookingSchema);
