const mongoose = require("mongoose");

const endeavourAuctionPaymentSchema = new mongoose.Schema(
  {
    buyerId: { type: String, default: "" },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },

    endeavourAuctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EndeavourAuction",
    },

    item: { type: String, required: true },

    sellerId: { type: String, default: "" },
    sellerName: { type: String, required: true },

    amountPaid: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    balanceAfter: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "EndeavourAuctionPayment",
  endeavourAuctionPaymentSchema
);
