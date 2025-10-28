const mongoose = require("mongoose");

const RegularExpenseSchema = new mongoose.Schema(
  {
    expensename: { type: String, required: true },
    expenseamount: { type: Number, required: true },
    expensedesc: { type: String },
    type_of_expense: { type: String, default: "regular_expense" },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RegularExpense", RegularExpenseSchema);
