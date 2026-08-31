import express from "express";
import Payment from "../models/Payment.js";

const router = express.Router();

// POST /payment/record - Record a payment transaction
router.post("/record", async (req, res) => {
  try {
    const {
      amount,
      supporterName,
      supporterEmail,
      message,
      paymentId,
      orderId,
      status,
    } = req.body;

    if (!amount || Number(amount) < 1) {
      return res.status(400).json({ message: "Valid payment amount is required" });
    }

    const newPayment = new Payment({
      amount: Number(amount),
      supporterName: supporterName?.trim() || "Kind Soulmate",
      supporterEmail: supporterEmail?.trim() || "",
      message: message?.trim() || "",
      paymentId: paymentId || `pay_manual_${Date.now()}`,
      orderId: orderId || "",
      status: status || "success",
      environment: process.env.NODE_ENV === "production" ? "production" : "development",
    });

    const savedPayment = await newPayment.save();

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment: savedPayment,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ message: "Server error recording payment", error: error.message });
  }
});

// GET /payment/history - Get payment statistics and recent public supporters
router.get("/history", async (req, res) => {
  try {
    const payments = await Payment.find({ status: "success" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("supporterName amount message createdAt");

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
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Server error fetching payment history", error: error.message });
  }
});

export default router;
