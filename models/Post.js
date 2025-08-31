// models/Post.js
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  roomId: String,
  text: String,
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    default: null,
  }, // <-- NEW

  photo: { type: String, default: "" }, // new field for photo filename
  audio: { type: String, default: "" },
  video: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

export default Post;
