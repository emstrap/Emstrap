import { Router } from "express";
import { getAlerts, getOverviewStats, getStats } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/overview-stats", getOverviewStats);
router.get("/alerts", getAlerts);
router.get("/stats", getStats);

export default router;
