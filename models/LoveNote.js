import mongoose from "mongoose";

const loveNoteSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  type: { type: String, enum: ["text", "voice", "doodle"], required: true },
  content: { type: String }, // for text or doodle URL
  audio: { type: String }, // cloudinary path for voice
  unlockedAt: { type: Date, default: Date.now }, // when it can be opened
  isInstant: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }, // ✅ track if viewed
});

export default mongoose.model("LoveNote", loveNoteSchema);
