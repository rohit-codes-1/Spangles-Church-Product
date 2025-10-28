const mongoose = require("mongoose");

const HarvestAuctionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    sellerId: { type: String },
    sellerName: { type: String },
    sellerPhone: { type: String },
    buyerId: { type: String },
    buyerName: { type: String },
    buyerPhone: { type: String },
    itemCode: { type: String, required: true },
    item: { type: String, required: true },
    amount: { type: Number, required: true },
    payment_status: { type: String, default: "Unpaid" },
    totalPaid: { type: Number, default: 0 },         // total paid so far
    balance: { type: Number, default: function() { return this.amount; } },
    payments: [
      {
        amountPaid: { type: Number },
        date: { type: Date, default: Date.now },
        balanceAfter: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("HarvestAuction", HarvestAuctionSchema);
