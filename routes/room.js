// routes/room.js
import express from "express";
import Room from "../models/Room.js";
import User from "../models/User.js"; // <--- add this
import authMiddleware from "../middlewares/authentication.js";
const router = express.Router();

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);

    const existingRoom = await User.findById(userId).select("room");
    if (existingRoom.room) {
      return res.status(400).json({ message: "User already has a room" });
    }

    const code = Math.random().toString(36).substring(2, 8);

    const room = await Room.create({
      name: req.body.name,
      code,
      users: [userId],
    });

    await User.findByIdAndUpdate(userId, { room: room._id });

    res.json(room);
  } catch (err) {
    console.error(err);
  }
});

router.post("/join/:code", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // set by JWT middleware
    const room = await Room.findOne({ code: req.params.code });

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.users.length >= 2)
      return res.status(400).json({ message: "Room full" });

    // check if user is already in a room
    if (room.users.includes(userId))
      return res.status(400).json({ message: "User already in this room" });

    room.users.push(userId);
    await room.save();

    await User.findByIdAndUpdate(userId, { room: room._id });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("users", "email");
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
