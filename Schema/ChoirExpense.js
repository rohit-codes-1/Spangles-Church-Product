const mongoose = require("mongoose");

const ChoirExpenseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["Paid", "Unpaid"],
            default: "Unpaid",
        },
        approval_status: {
            type: String,
            enum: ["Waiting", "Approved", "Rejected"],
            default: "Waiting",
        },
        addedBy: {
            type: String,   // 👈 store member code like "MBR000027"
            required: true,
        },
        addedByRole: {
            type: String,
            required: true,
            trim: true,
        },
        paidAmount: { type: Number, default: 0 },
        spendByType: { type: String, enum: ["Member", "Non-Member"], default: null },
        spendById: { type: String, default: null },      // memberId if Member
        spendByName: { type: String, default: null },
        spendByPhone: { type: String, default: null },
        spendByPlace: { type: String, default: null },
        billStatus: { type: String, enum: ["Open", "Closed"], default: "Open" },
        billName: { type: String, default: null },
        billNo: { type: String, default: null },
        billFile: { type: String, default: null }, // file path (upload)
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChoirExpense", ChoirExpenseSchema);
