import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js"
import { createEmergencyRequest, acceptEmergency, declineEmergency, getDriverHistory } from "../controllers/emergency.controller.js";

const router = express.Router();

router.post("/", createEmergencyRequest);

router.get("/driver/history", authMiddleware, getDriverHistory);
router.put("/:id/accept", authMiddleware, acceptEmergency);
router.put("/:id/decline", authMiddleware, declineEmergency);

export default router;
