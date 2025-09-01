// routes/bucketList.ts
import express from "express";
import BucketList from "../models/BucketList.js";
import authMiddleware from "../middlewares/authentication.js";

const router = express.Router();

// ✅ Get all bucket list items for a room
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const items = await BucketList.find({ roomId: req.params.roomId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add new item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { roomId, item } = req.body;
    const newItem = await BucketList.create({ roomId, item });
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to add item" });
  }
});

// ✅ Toggle complete
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await BucketList.findByIdAndUpdate(
      req.params.id,
      { $set: { completed: req.body.completed } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// ✅ Delete item
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await BucketList.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
