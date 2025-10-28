const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amountPaid: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  balanceAfter: { type: Number, default: 0 },
});

const endeavourAuctionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },

    seller: {
      member_id: String,
      name: { type: String, required: true },
      tamil_name: String,
      class_name: String,
      section_name: String,
    },

    buyer: {
      isMember: { type: Boolean, default: false },
      member_id: String,
      name: { type: String, required: true },
      tamil_name: String,
      phone: { type: String, required: true },
    },

    item: { type: String, required: true },
    amount: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EndeavourAuction", endeavourAuctionSchema);
