import { Router } from "express";
import { getActiveEmergencies } from "../controllers/police.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import policeMiddleware from "../middlewares/police.middleware.js";

const router = Router();

// Apply security barriers globally to police namespace
router.use(authMiddleware, policeMiddleware);

// Active Emergency Plotting
router.get("/emergencies", getActiveEmergencies);

export default router;
