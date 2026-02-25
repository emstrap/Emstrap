import { Router } from "express";
import { registerUser, loginUser, logoutUser, getMe, updateUser, verifyEmail } from "../controllers/auth.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateUser);
router.get("/verify-email/:token", verifyEmail);

export default router;
