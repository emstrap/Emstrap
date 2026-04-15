import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import emergencyRoutes from "./src/routes/emergency.route.js"
import authRoutes from "./src/routes/user.route.js";
import adminRoutes from "./src/routes/admin.route.js";
import policeRoutes from "./src/routes/police.route.js";
import bookingRoutes from "./src/routes/booking.route.js";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/api/emergency", emergencyRoutes)
app.use("/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/police", policeRoutes);

export default app;
