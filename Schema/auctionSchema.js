const mongoose = require("mongoose");

// Subdocument schema for payments
const PaymentSchema = new mongoose.Schema({
  amountPaid: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  balanceAfter: { type: Number }
});

const AuctionSchema = new mongoose.Schema(
  {
    sellerId: { type: String },
    sellerName: { type: String, },
    sellerPhone: { type: String },

    buyerId: { type: String },
    buyerName: { type: String,  },
    buyerPhone: { type: String },

    item: { type: String, required: true },
    amount: { type: Number, required: true },   // 🔹 original price (immutable)
    balance: { type: Number,  },  // 🔹 track remaining balance

    payment_status: {
      type: String},

    payments: [PaymentSchema],
    totalPaid: { type: Number, default: 0 },

    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// 🔹 Ensure balance defaults to amount when created
AuctionSchema.pre("save", function (next) {
  if (this.isNew) {
    this.balance = this.amount;
  }
  next();
});



module.exports = mongoose.model("Auction", AuctionSchema);
