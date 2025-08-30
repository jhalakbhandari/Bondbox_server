// routes/post.js
import express from "express";
import Post from "../models/Post.js";
const router = express.Router();
import authMiddleware from "../middlewares/authentication.js";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/"); // folder to save images
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "myapp_uploads",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });
router.post("/", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const { roomId, text } = req.body;
    // const photo = req.file ? req.file.filename : "";
    const photo = req.file ? req.file.path : "";

    if (!text && !photo)
      return res.status(400).json({ message: "Post cannot be empty" });

    const post = await Post.create({ roomId: roomId, text, photo });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get posts for a room
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ roomId: req.params.roomId }).sort({
      createdAt: 1,
    });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
