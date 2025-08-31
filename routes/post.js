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

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "myapp_uploads",
//     allowed_formats: ["jpg", "png", "jpeg"],
//   },
// });

// const upload = multer({ storage });
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "bondbox_uploads"; // your main Cloudinary folder
    let resource_type = "auto"; // auto-detect (image, video, audio)

    // Optional: separate folders by type
    if (file.mimetype.startsWith("image/")) folder = "bondbox_uploads/images";
    else if (file.mimetype.startsWith("video/"))
      folder = "bondbox_uploads/videos";
    else if (file.mimetype.startsWith("audio/"))
      folder = "bondbox_uploads/audios";

    return {
      folder,
      resource_type,
      public_id: Date.now().toString(), // unique filename
    };
  },
});

const upload = multer({ storage });
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
      const { roomId, text } = req.body;

      const photo = req.files["photo"] ? req.files["photo"][0].path : "";
      const audio = req.files["audio"] ? req.files["audio"][0].path : "";
      const video = req.files["video"] ? req.files["video"][0].path : "";

      if (!text && !photo && !audio && !video) {
        return res.status(400).json({ message: "Post cannot be empty" });
      }

      const post = await Post.create({
        roomId,
        text,
        photo,
        audio,
        video,
      });

      res.json(post);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get posts for a room
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ roomId: req.params.roomId }).sort({
      createdAt: -1,
    });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
