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
        imgSrc: ["'self'", "https:", "data:"],
        connectSrc: [
          "'self'",
          "https:",
          "https://bondbox-client.vercel.app", // allow API calls from client
        ],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard: { action: "sameorigin" }, // X-Frame-Options
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false, // prevent build issues with some libs
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
app.use(cors());
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

// Sample route
app.get("/", (req, res) => {
  res.send("Hello from Express API 🚀");
});

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const server = app.listen(PORT, () => console.log(`Server running on ${PORT}`));
initSocket(server);
