import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  supporterName: {
    type: String,
    default: "Kind Soulmate",
    trim: true,
  },
  supporterEmail: {
    type: String,
    default: "",
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  currency: {
    type: String,
    default: "INR",
  },
  message: {
    type: String,
    default: "",
    trim: true,
  },
  paymentId: {
    type: String,
    default: "",
    trim: true,
  },
  orderId: {
    type: String,
    default: "",
    trim: true,
  },
  status: {
    type: String,
    default: "success",
    enum: ["success", "pending", "failed"],
  },
  environment: {
    type: String,
    enum: ["development", "production", "test"],
    default: process.env.NODE_ENV === "production" ? "production" : "development",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Dynamic collection name:
// If PAYMENT_COLLECTION is set in .env, use that exact table/collection name.
// Otherwise: 'payments_production' in production, 'payments_dev' in development.
const collectionName =
  process.env.PAYMENT_COLLECTION ||
  (process.env.NODE_ENV === "production" ? "payments_production" : "payments_dev");

export default mongoose.model("Payment", paymentSchema, collectionName);
