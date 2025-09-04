// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authentication.js";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 tries
  message: "Too many login attempts. Try again later.",
});

const router = express.Router();
// const JWT_SECRET = "supersecret"; // ⚠️ use env variable in prod

// Signup
router.post(
  "/signup",
  [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must have an uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must have a lowercase letter")
      .matches(/\d/)
      .withMessage("Password must have a number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Password must have a special character"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: "User exists" });

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ email, password: hashed });

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Login

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/[A-Za-z0-9!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password contains invalid characters"),
  ],
  loginLimiter,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("room");
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found. Incorrect email or password." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      user,
      token,
      roomId: user.room ? user.room._id : null, // tell frontend if user already has room
    });
  }
);
// router.get("/me", authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.userId).populate("room");
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.json({
//       user,
//       roomId: user.room ? user.room._id : null,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

export default router;
