const mongoose = require("mongoose");

const YouthAuctionPaymentSchema = new mongoose.Schema(
  {
    youthAuctionId: { type: mongoose.Schema.Types.ObjectId, ref: "YouthAuction" },
    buyerId: { type: String },
    buyerName: { type: String },
    buyerPhone: { type: String },

    sellerId: { type: String },
    sellerName: { type: String },

    item: { type: String },
    amountPaid: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("YouthAuctionPayment", YouthAuctionPaymentSchema);
