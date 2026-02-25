import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { createBooking, getBookings } from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createBooking);
router.get("/", authMiddleware, getBookings);

export default router;
