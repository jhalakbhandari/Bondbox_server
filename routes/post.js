// routes/post.js
import express from "express";
import Post from "../models/Post.js";
import authMiddleware from "../middlewares/authentication.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "bondbox_uploads";
    let resource_type = "auto";

    if (file.mimetype.startsWith("image/")) folder = "bondbox_uploads/images";
    else if (file.mimetype.startsWith("video/"))
      folder = "bondbox_uploads/videos";
    else if (file.mimetype.startsWith("audio/"))
      folder = "bondbox_uploads/audios";

    return {
      folder,
      resource_type,
      public_id: Date.now().toString(),
    };
  },
});

const upload = multer({ storage });

// Create a new post / memory
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "audio", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { roomId, text, sessionId } = req.body;

      const photo = req.files && req.files["photo"] ? req.files["photo"][0].path : "";
      const audio = req.files && req.files["audio"] ? req.files["audio"][0].path : "";
      const video = req.files && req.files["video"] ? req.files["video"][0].path : "";

      if (!text && !photo && !audio && !video) {
        return res.status(400).json({ message: "Post cannot be empty" });
      }

      const post = await Post.create({
        roomId,
        sessionId: sessionId || null,
        text,
        photo,
        audio,
        video,
      });

      res.json(post);
    } catch (err) {
      console.error("Error creating post:", err);
      res.status(500).json({ message: "Server error creating memory" });
    }
  }
);

// Get posts for a room with pagination
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const posts = await Post.find({ roomId })
      .populate("sessionId", "label startedAt finishedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ roomId });

    res.json({
      posts,
      hasMore: skip + posts.length < totalPosts,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error fetching memories" });
  }
});

// Delete a post / memory
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) {
      return res.status(404).json({ message: "Memory not found" });
    }
    res.json({ message: "Memory deleted successfully", id });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Server error deleting memory" });
  }
});

export default router;
