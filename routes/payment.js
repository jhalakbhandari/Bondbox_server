import express from "express";
import rateLimit from "express-rate-limit";
import Payment from "../models/Payment.js";

const router = express.Router();

// Rate limiter for recording payments: prevents spam, DB exhaustion, and metric manipulation
const recordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 support notes per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many support requests from this IP. Please try again later.",
  },
});

// Rate limiter for reading payment history
const historyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 history queries per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper for sanitizing strings and stripping HTML
const sanitizeInput = (val, maxLength) => {
  if (typeof val !== "string") return "";
  return val
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, maxLength);
};

// POST /payment/record - Record a voluntary support note
router.post("/record", recordLimiter, async (req, res) => {
  try {
    const { amount, currency, supporterName, message, paymentId } = req.body;

    // Strict numerical bounds validation (1 to 100,000 max)
    const parsedAmount = Number(amount);
    if (
      typeof parsedAmount !== "number" ||
      isNaN(parsedAmount) ||
      !isFinite(parsedAmount) ||
      parsedAmount < 1 ||
      parsedAmount > 100000
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid voluntary support amount between 1 and 100,000 is required.",
      });
    }

    const safeAmount = Math.round(parsedAmount * 100) / 100;
    const safeCurrency = currency === "USD" ? "USD" : "INR";
    const safeName = sanitizeInput(supporterName, 50) || "Kind Soulmate";
    const safeMessage = sanitizeInput(message, 200);

    // Validate paymentId format or generate safe fallback
    const safePaymentId =
      typeof paymentId === "string" && /^[a-zA-Z0-9_\-]{1,64}$/.test(paymentId.trim())
        ? paymentId.trim()
        : `pay_vol_${Date.now()}`;

    const newPayment = new Payment({
      amount: safeAmount,
      currency: safeCurrency,
      supporterName: safeName,
      message: safeMessage,
      paymentId: safePaymentId,
      status: "success",
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
    });

    const savedPayment = await newPayment.save();

    res.status(201).json({
      success: true,
      message: "Support note recorded successfully",
      payment: {
        _id: savedPayment._id,
        amount: savedPayment.amount,
        currency: savedPayment.currency,
        supporterName: savedPayment.supporterName,
        message: savedPayment.message,
        createdAt: savedPayment.createdAt,
      },
    });
  } catch (error) {
    // Log safe server error without leaking stack or database details to frontend
    console.error("Error in /payment/record:", error.message);
    res.status(500).json({
      success: false,
      message: "An internal error occurred while saving your support note. Please try again later.",
    });
  }
});

// GET /payment/history - Get payment statistics and recent public supporters
router.get("/history", historyLimiter, async (req, res) => {
  try {
    const payments = await Payment.find({ status: "success" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("supporterName amount currency message createdAt");

    const totalStats = await Payment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const totalRaised = totalStats[0]?.totalAmount || 0;
    const supporterCount = totalStats[0]?.totalCount || 0;

    res.json({
      success: true,
      totalRaised,
      supporterCount,
      recentSupporters: payments,
    });
  } catch (error) {
    // Log safe server error without leaking internals
    console.error("Error in /payment/history:", error.message);
    res.status(500).json({
      success: false,
      message: "An internal error occurred while fetching support history.",
    });
  }
});

export default router;
