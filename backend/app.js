import express, { json } from "express";
import cors from "cors";
import "dotenv/config";
import emergencyRoutes from "./src/routes/emergency.route.js"
import authRoutes from "./src/routes/user.route.js";


const app = express();

app.use(cors());
app.use(json());
app.use("/api/emergency", emergencyRoutes )
app.use("/auth",authRoutes);

export default app;
