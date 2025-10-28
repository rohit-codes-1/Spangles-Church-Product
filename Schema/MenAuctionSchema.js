const mongoose = require("mongoose");

const MenAuctionSchema = new mongoose.Schema(
  {
    sellerId: {
      type: String,
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
    sellerTamilName: {
      type: String,
    },
    sellerPhone: {
      type: String,
      required: true,
    },
    buyerId: {
      type: String,
      required: true,
    },
    buyerName: {
      type: String,
      required: true,
    },
    buyerTamilName: {
      type: String,
    },
    buyerPhone: {
      type: String,
      required: true,
    },
    item: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenAuction", MenAuctionSchema);
