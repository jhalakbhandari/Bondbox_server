import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: String,
  code: String,
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
});

const Room = mongoose.model("Room", roomSchema);

export default Room;
