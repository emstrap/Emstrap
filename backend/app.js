import express, { json } from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./src/routes/user.route.js";


const app = express();

app.use(cors());
app.use(json());

app.use("/auth",authRoutes);

export default app;
