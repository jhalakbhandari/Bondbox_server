import express from "express";
import LoveNote from "../models/LoveNote.js";
import authMiddleware from "../middlewares/authentication.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "bondbox/lovenotes";
    let resource_type = "auto";
    return { folder, resource_type, public_id: Date.now().toString() };
  },
});
const upload = multer({ storage });

router.post(
  "/",
  authMiddleware,
  upload.single("file"), // optional voice/doodle
  async (req, res) => {
    try {
      const { receiverId, roomId, type, text, unlockTime, isInstant } =
        req.body;
      const file = req.file?.path;
      console.log("request", req.user);
      const note = await LoveNote.create({
        senderId: req.user.id,
        receiverId: receiverId,
        roomId,
        type,
        content: type === "text" ? text : file,
        audio: type === "voice" ? file : "",
        unlockedAt: isInstant ? Date.now() : new Date(unlockTime),
        isInstant,
      });

      res.json(note);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get love notes for a user (only unlocked)
router.get("/:roomId/:userId", authMiddleware, async (req, res) => {
  const now = Date.now();
  const notes = await LoveNote.find({
    roomId: req.params.roomId,
    receiverId: req.params.userId,
    unlockedAt: { $lte: now },
  }).populate("senderId", "name avatar");

  res.json(notes);
});

export default router;
