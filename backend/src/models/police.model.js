import { Schema, model } from "mongoose";

const policeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    station: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Police", policeSchema);
