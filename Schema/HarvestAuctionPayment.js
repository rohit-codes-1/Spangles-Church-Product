const mongoose = require("mongoose");

const HarvestAuctionPaymentSchema = new mongoose.Schema(
  {
    harvestAuctionId: { type: mongoose.Schema.Types.ObjectId, ref: "HarvestAuction" },
    buyerId: { type: String },
    buyerName: { type: String },
    buyerPhone: { type: String },
    sellerId: { type: String },
    sellerName: { type: String },
    item: { type: String },
    amountPaid: { type: Number },
    balanceAfter: { type: Number },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HarvestAuctionPayment", HarvestAuctionPaymentSchema);
