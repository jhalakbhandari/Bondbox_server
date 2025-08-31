// routes/session.js
import express from "express";
import Session from "../models/Session.js";
import Post from "../models/Post.js";
import authMiddleware from "../middlewares/authentication.js";

const router = express.Router();

// Start a session
router.post("/start", authMiddleware, async (req, res) => {
  try {
    const { roomId, label } = req.body;
    const session = await Session.create({ roomId, label });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Finish a session
router.post("/finish/:sessionId", authMiddleware, async (req, res) => {
  try {
    console.log("params", req.params);

    const { sessionId } = req.params; // get from URL params
    console.log("Session ID:", sessionId);

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { finishedAt: new Date() },
      { new: true }
    );

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/active/:roomId", authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({
      roomId: req.params.roomId,
      finishedAt: { $exists: false }, // unfinished sessions
    });
    res.json(session || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get sessions with posts
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({ roomId: req.params.roomId })
      .sort({ startedAt: -1 })
      .lean();

    // populate posts inside each session
    for (let s of sessions) {
      s.posts = await Post.find({ sessionId: s._id }).sort({ createdAt: 1 });
    }

    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
