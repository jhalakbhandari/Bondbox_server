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
    let folder = "bondbox_uploads";
    let resource_type = "auto";

    if (file.mimetype.startsWith("image/")) {
      folder = "bondbox_uploads/images";
      return {
        folder,
        resource_type: "image",
        format: "jpg", // Auto-convert HEIC, HEIF, TIFF to standard JPG for universal browser compatibility
        public_id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      };
    } else if (file.mimetype.startsWith("video/")) {
      folder = "bondbox_uploads/videos";
      resource_type = "video";
    } else if (file.mimetype.startsWith("audio/")) {
      folder = "bondbox_uploads/audios";
      resource_type = "video";
    }

    return {
      folder,
      resource_type,
      public_id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  },
});

const upload = multer({ storage });

const getFileUrl = (files, fieldName) => {
  if (!files || !files[fieldName] || !files[fieldName][0]) return "";
  const file = files[fieldName][0];
  let url = file.path || file.secure_url || file.url || "";
  if (url.startsWith("http://res.cloudinary.com/")) {
    url = url.replace("http://res.cloudinary.com/", "https://res.cloudinary.com/");
  }
  return url;
};

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

      const photo = getFileUrl(req.files, "photo");
      const audio = getFileUrl(req.files, "audio");
      const video = getFileUrl(req.files, "video");

      if (!text && !photo && !audio && !video) {
        return res.status(400).json({ message: "Post cannot be empty" });
      }

      const post = await Post.create({
        roomId,
        sessionId: sessionId || null, // attach to session if provided
        text: text || "",
        photo,
        audio,
        video,
      });

      res.json(post);
    } catch (err) {
      console.error("Post creation error:", err);
      res.status(500).json({ message: "Server error creating post" });
    }

  }
);

// Get posts for a room
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    // const posts = await Post.find({ roomId: req.params.roomId })
    //   .populate("sessionId", "label")
    //   .sort({
    //     createdAt: -1,
    //   });
    // res.json(posts);
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // Fetch posts with pagination
    const posts = await Post.find({ roomId })
      .populate("sessionId", "label startedAt finishedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Total count for hasMore
    const totalPosts = await Post.countDocuments({ roomId });

    res.json({
      posts,
      hasMore: skip + posts.length < totalPosts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching posts" });
  }
});

// Delete a post/memory
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

