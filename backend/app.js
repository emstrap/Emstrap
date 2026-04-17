import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import mongoose from "mongoose";
import emergencyRoutes from "./src/routes/emergency.route.js"
import authRoutes from "./src/routes/user.route.js";
import adminRoutes from "./src/routes/admin.route.js";
import policeRoutes from "./src/routes/police.route.js";
import bookingRoutes from "./src/routes/booking.route.js";
import hospitalRoutes from "./src/routes/hospital.route.js";
import usersRoutes from "./src/routes/users.route.js";
import ambulanceRoutes from "./src/routes/ambulance.route.js";
import dashboardRoutes from "./src/routes/dashboard.route.js";

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.get("/api/test", (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    res.status(200).json({
        success: true,
        message: "API is running",
        timestamp: new Date().toISOString(),
        database: {
            connected: isConnected
        }
    });
});

app.use("/api/emergency", emergencyRoutes)
app.use("/api", dashboardRoutes);
app.use("/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/police", policeRoutes);
app.use("/api/ambulances", ambulanceRoutes);
app.use("/api/hospitals", hospitalRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

app.use((error, req, res, next) => {
    const statusCode = error?.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: error?.message || "Internal server error"
    });
});

export default app;
