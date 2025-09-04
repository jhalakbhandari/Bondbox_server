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
app.use(helmet());

// Strict-Transport-Security (forces HTTPS)
app.use(
  helmet.hsts({
    maxAge: 63072000, // 2 years in seconds
    includeSubDomains: true,
    preload: true,
  })
);

// Content-Security-Policy (control allowed sources)
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https:"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

// X-Frame-Options (prevent clickjacking)
app.use(helmet.frameguard({ action: "sameorigin" }));

// X-Content-Type-Options (prevent MIME sniffing)
app.use(helmet.noSniff());

// Referrer-Policy (control referrer info)
app.use(helmet.referrerPolicy({ policy: "no-referrer" }));

// Permissions-Policy (limit browser features, replaces Feature-Policy)
app.use(
  helmet.permissionsPolicy({
    features: {
      camera: ["none"],
      microphone: ["none"],
      geolocation: ["none"],
      fullscreen: ["self"],
    },
  })
);

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
