// models/Session.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  roomId: String,
  label: String, // e.g. "Spain Trip"
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date }, // set when user clicks Finish
});

const Session = mongoose.model("Session", sessionSchema);
export default Session;
