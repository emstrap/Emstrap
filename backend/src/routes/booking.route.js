import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { createBooking, getBookings, cancelBooking } from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createBooking);
router.get("/", authMiddleware, getBookings);
router.put("/:id/cancel", authMiddleware, cancelBooking);

export default router;
