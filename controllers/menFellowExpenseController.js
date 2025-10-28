// menFellowExpenseController.js

const MenFellowExpense = require("../Schema/MenExpense");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ➕ Add Expense
exports.addExpense = async (req, res) => {
  try {
    const expense = new MenFellowExpense(req.body);
    await expense.save();
    res.status(201).json({ message: "Expense added successfully", expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add expense", error: err.message });
  }
};

// GET Expenses with pagination, filters, search
exports.getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status && req.query.status !== "All") {
      filter.status = req.query.status;
    }
    if (req.query.approval_status && req.query.approval_status !== "All") {
      filter.approval_status = req.query.approval_status;
    }
    if (req.query.billStatus && req.query.billStatus !== "All") {
      filter.billStatus = req.query.billStatus;
    }
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, "i") },
        { spendByName: new RegExp(req.query.search, "i") },
        { addedBy: new RegExp(req.query.search, "i") },
      ];
    }

    const expenses = await MenFellowExpense.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MenFellowExpense.countDocuments(filter);

    res.json({
      expenses,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching expenses", error: err.message });
  }
};

// 👀 Get Single Expense
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await MenFellowExpense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: "Error fetching expense", error: err.message });
  }
};

// ✏️ Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const expense = await MenFellowExpense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense updated", expense });
  } catch (err) {
    res.status(500).json({ message: "Error updating expense", error: err.message });
  }
};

// 💰 Mark as Paid
exports.payExpense = async (req, res) => {
  try {
    const expense = await MenFellowExpense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    expense.status = "Paid";
    expense.paidAmount = req.body.paidAmount;

    if (req.body.memberId) {
      expense.spendByType = "Member";
      expense.spendById = req.body.memberId;
      expense.spendByName = req.body.memberName;
      expense.spendByPhone = req.body.memberPhone;
    } else {
      expense.spendByType = "Non-Member";
      expense.spendByName = req.body.nonMemberName;
      expense.spendByPhone = req.body.nonMemberPhone;
      expense.spendByPlace = req.body.nonMemberPlace;
    }

    await expense.save();
    res.json({ status: "Success", message: "Expense marked as paid", expense });
  } catch (err) {
    res.status(500).json({ message: "Error paying expense", error: err.message });
  }
};

// ❌ Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await MenFellowExpense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting expense", error: err.message });
  }
};

// PATCH /expenses/close-bill/:id
exports.closeBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { billName, billNo } = req.body;
    const billFile = req.file ? req.file.path : null;

    if (!billName || !billNo || !billFile) {
      return res.status(400).json({
        status: "Failed",
        message: "Bill name, number, and file are required",
      });
    }

    const expense = await MenFellowExpense.findById(id);
    if (!expense) return res.status(404).json({ status: "Failed", message: "Expense not found" });

    expense.billName = billName;
    expense.billNo = billNo;
    expense.billFile = billFile;
    expense.billStatus = "Closed";

    await expense.save();

    res.status(200).json({
      status: "Success",
      message: "Bill closed successfully",
      data: expense,
    });
  } catch (err) {
    console.error("Close Bill Error:", err);
    res.status(500).json({ status: "Failed", message: err.message });
  }
};

// Multer setup for Men Fellowship bills
const uploadDir = "uploads/menfellowbills";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

exports.uploadBill = multer({ storage });
