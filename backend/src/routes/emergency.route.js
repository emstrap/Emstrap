import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js"
import { createEmergencyRequest, acceptEmergency, declineEmergency, getDriverHistory, cancelEmergency, assignHospital, completeRequest, getEmergencyDetails, markArrived } from "../controllers/emergency.controller.js";

const router = express.Router();

router.post("/", createEmergencyRequest);

router.get("/driver/history", authMiddleware, getDriverHistory);
router.get("/:id", getEmergencyDetails);
router.put("/:id/accept", authMiddleware, acceptEmergency);
router.put("/:id/decline", authMiddleware, declineEmergency);
router.put("/:id/cancel", cancelEmergency);
router.put("/:id/mark-arrived", authMiddleware, markArrived);
router.put("/:id/assign-hospital", authMiddleware, assignHospital);
router.put("/:id/complete", authMiddleware, completeRequest);

export default router;
