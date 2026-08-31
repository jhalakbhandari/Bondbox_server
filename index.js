import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import roomRoutes from "./routes/room.js";
import postRoutes from "./routes/post.js";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/session.js";
import loveNoteRoutes from "./routes/lovenote.js";
import bucketListRoutes from "./routes/bucketlist.js";
import exportRoutes from "./routes/export.js";
import paymentRoutes from "./routes/payment.js";
import helmet from "helmet";

import fs from "fs";
import dotenv from "dotenv";
import { initSocket } from "./config/socket.js";

dotenv.config();

const app = express();
// ✅ Helmet with security configs
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "https://bondbox-client.vercel.app"],
        scriptSrc: ["'self'", "https:"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        imgSrc: ["'self'", "https:", "http:", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: [
          "'self'",
          "https:",
          "http:",
          "wss:",
          "ws:",
          "https://bondbox-client.vercel.app",
          "https://bondbox-server.onrender.com",
          "wss://bondbox-server.onrender.com",
          "https://api.cloudinary.com",
          "http://localhost:*",
          "ws://localhost:*",
          "http://127.0.0.1:*",
          "ws://127.0.0.1:*",
        ],
        fontSrc: ["'self'", "https:", "data:"],
        mediaSrc: ["'self'", "blob:", "data:", "http:", "https:", "https://res.cloudinary.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard: { action: "sameorigin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// ✅ Extra headers not covered by Helmet
app.use((req, res, next) => {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=*, geolocation=()"
  );
  next();
});

const PORT = process.env.PORT || 5000;
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
// Middleware to parse JSON
app.use(express.json());
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/auth", authRoutes);
app.use("/room", roomRoutes);
app.use("/post", postRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/session", sessionRoutes);
app.use("/lovenote", loveNoteRoutes);
app.use("/bucketlist", bucketListRoutes);
app.use("/exports", exportRoutes);
app.use("/payment", paymentRoutes);

// Sample route
app.get("/", (req, res) => {
  res.send("Hello from Express API 🚀");
});

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn("⚠️  DATABASE_URL environment variable is missing! Please configure it in .env");
} else {
  mongoose
    .connect(dbUrl, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    .then((conn) => {
      console.log(`✅ MongoDB connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message || err);
      console.warn("💡 Tip: In live production, ensure MongoDB Atlas Network Access has 0.0.0.0/0 (Allow Access from Anywhere) enabled.");
    });
}

const server = app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
initSocket(server);

