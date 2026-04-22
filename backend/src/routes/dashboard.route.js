import { Router } from "express";
import { getAlerts, getOverviewStats, getStats, updateEmergencyStatus } from "../controllers/dashboard.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/overview-stats", getOverviewStats);
router.get("/alerts", getAlerts);
router.get("/stats", getStats);
router.put("/emergencies/:id/status", authMiddleware, updateEmergencyStatus);

export default router;
