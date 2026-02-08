import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate Token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: "30d"
//   });
// };

// REGISTER
export const registerUser = async (req, res) => {
  const { name, email, password, address, role, city, phone } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || "user";
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      address,
      city,
      role: userRole,
      phone
    });

    res.status(201).json(user);

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
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.json({
        message: "Login successful",
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });

    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 
