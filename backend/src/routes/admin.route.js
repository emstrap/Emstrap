import { Router } from "express";
import { getSystemMetrics, getAllUsers, updateUserRole, getAllEmergencies } from "../controllers/admin.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = Router();

// Apply auth and admin protections securely to all downstream routes in this router
router.use(authMiddleware, adminMiddleware);

router.get("/metrics", getSystemMetrics);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.get("/emergencies", getAllEmergencies);

export default router;
