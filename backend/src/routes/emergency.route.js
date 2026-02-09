import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js"
import { createEmergencyRequest } from "../controllers/emergency.controller.js";


const router = express.Router();

// Only normal user can create SOS
router.post(
  "/",
  authMiddleware,
  createEmergencyRequest
);

export default router;
