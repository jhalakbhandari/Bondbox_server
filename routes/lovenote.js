import express from "express";
import LoveNote from "../models/LoveNote.js";
import authMiddleware from "../middlewares/authentication.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { notifyLoveNote } from "../config/socket.js";
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
      await note.save();

      // 🔔 Notify receiver in real-time
      notifyLoveNote(receiverId, {
        _id: note._id,
        roomId,
        type,
        content: note.content,
        audio: note.audio,
        senderId: req.user.id,
        createdAt: note.createdAt,
        isInstant: note.isInstant,
      });

      res.json(note);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get love notes for a user (only unlocked)
router.get("/:roomId", authMiddleware, async (req, res) => {
  const now = Date.now();
  const userId = req.user.id; // extracted from token
  const { roomId } = req.params;

  const notes = await LoveNote.find({
    roomId: req.params.roomId,
    receiverId: userId,
    unlockedAt: { $lte: now },
  }).populate("senderId", "name avatar");

  res.json(notes);
});
router.post("/read/:id", async (req, res) => {
  const { id } = req.params;
  console.log("noteid", id);
  try {
    const note = await LoveNote.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    // await LoveNote.findByIdAndDelete(n._id);

    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark note as read" });
  }
});

export default router;
