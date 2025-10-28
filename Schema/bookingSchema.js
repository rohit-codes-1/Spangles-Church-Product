const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    hall: { type: mongoose.Schema.Types.ObjectId, ref: "MarriageHall", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "MarriageHallCategory", required: true },
    date: { type: Date, required: true },
    // session: { type: String, enum: ["morning", "evening"], required: true },
    sessions: { type: [String], enum: ["morning", "evening"], required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    amount: { type: Number, required: true },
    advanceAmount: { type: Number, default: 0 },
    payment_status: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
    booking_status: { type: String, enum: ["Completed", "Reserved", "Cancelled"], default: "Reserved" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
