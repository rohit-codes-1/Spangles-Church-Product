const mongoose = require("mongoose");

const WomenAuctionSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    sellerTamilName: { type: String },
    sellerPhone: { type: String, required: true },

    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerTamilName: { type: String },
    buyerPhone: { type: String, required: true },

    item: { type: String, required: true },
    amount: { type: Number, required: true },

    payment_status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },

    totalPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    payments: [
      {
        amountPaid: Number,
        date: { type: Date, default: Date.now },
        balanceAfter: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WomenAuction", WomenAuctionSchema);
