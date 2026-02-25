import { Schema, model } from "mongoose";

const hospitalSchema = new Schema(
    {
        name: {
            type: String,
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
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        availableBeds: {
            type: Number,
            default: 0
        },
        specialities: {
            type: [String],
            default: []
        }
    },
    { timestamps: true }
);

export default model("Hospital", hospitalSchema);
