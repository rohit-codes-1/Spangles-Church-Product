// models/Expense.js
const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    expensename: { type: String, required: true },
    expenseamount: { type: Number, required: true },
    expensedesc: { type: String },
    type_of_expense: { type: String, enum: ["regular_expense", "irregular_expense"], required: true },
    
    status: { 
      type: String, 
      enum: ["unpaid", "paid"], 
      default: "unpaid" 
    },
    approval_status: { 
      type: String, 
      enum: ["waiting", "accepted", "rejected"], 
      default: "waiting" 
    },
        // ✅ Payment details
    paidAmount: { type: Number },
    paidAt: { type: Date },

    // If paid by member
    memberId: { type: String },
    memberName: { type: String },
    memberPhone: { type: String },

    // If paid by non-member
    nonMemberName: { type: String },
    nonMemberPhone: { type: String },
    nonMemberPlace: { type: String },

    addedBy: { type: String, required: true },       // store member_id
    addedByRole: { type: String, required: true },
    reviewedBy: { type: String }, 
    reviewedAt: { type: Date },
    billName: { type: String },
    billNo: { type: String },
    billFile: { type: String }, // store file path
    billStatus: { type: String, enum: ["Pending", "Closed"], default: "Pending" }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
