import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";


// Helper function to set JWT in an HttpOnly cookie
const generateTokenAndSetCookie = (user, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // True in production (HTTPS)
    sameSite: "Strict", // Prevents CSRF
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });

  return token;
};

// REGISTER
export const registerUser = async (req, res) => {
  const { name, email, password, address, role, city, vehicleNumber } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "user";

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verifyUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    const message = `Please confirm your email by visiting the following link: \n\n ${verifyUrl}`;
    {/* <h2 style="color: #333;">Verify your Emstrap account</h2> */ }
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <p style="color: #555; font-size: 16px;">Hello ${name},</p>
        <p style="color: #555; font-size: 16px;">Welcome to Emstrap! We’re excited to have you on board.</p>
        <p style="color: #555; font-size: 16px;">To get started and gain full access to your account, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #555; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; word-break: break-all;"><a href="${verifyUrl}" style="color: #007BFF;">${verifyUrl}</a></p>
        
        <h3 style="color: #333; margin-top: 30px;">Why verify?</h3>
        <ul style="color: #555; font-size: 14px; line-height: 1.6;">
          <li>Secure your account data.</li>
          <li>Receive important updates regarding your projects.</li>
          <li>Enable full platform features.</li>
        </ul>
        
        <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
          This link will expire in 24 hours. If you did not create an account with Emstrap, please ignore this email.
        </p>
        <p style="color: #555; font-size: 14px; margin-top: 20px;">
          Cheers,<br>
          <strong>The Emstrap Team</strong>
        </p>
      </div>
    `;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      address,
      city,
      role: userRole,
      vehicleNumber: userRole === "ambulance_driver" ? vehicleNumber : undefined,
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours expires
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "Verify your Emstrap account",
        message,
        htmlMessage
      });

      await user.save();

      res.status(201).json({
        message: "Registration successful. Please check your email to verify your account before logging in."
      });
    } catch (error) {
      console.error("Email error:", error);
      return res.status(500).json({ message: "There was an error sending the email. Please try again later." });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Verification token is invalid or has expired." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Email successfully verified." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json("User not found");

    if (user && (await bcrypt.compare(password, user.password))) {

      if (!user.isEmailVerified) {
        return res.status(401).json({ message: "Please verify your email to login" });
      }

      generateTokenAndSetCookie(user, res);

      res.json({
        message: "Login successful",
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });

    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET CURRENT USER (For session restoration)
export const getMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    expires: new Date(0) // Expire immediately
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// UPDATE USER PROFILE
export const updateUser = async (req, res) => {
  const { name, email, city, address } = req.body;
  try {
    const userId = req.user._id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, city, address, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
