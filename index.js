import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import roomRoutes from "./routes/room.js";
import postRoutes from "./routes/post.js";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/session.js";
import loveNoteRoutes from "./routes/lovenote.js";
import fs from "fs";
import dotenv from "dotenv";
import { initSocket } from "./config/socket.js";

dotenv.config();

const app = express();
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
