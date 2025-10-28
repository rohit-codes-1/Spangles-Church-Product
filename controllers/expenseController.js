// controllers/expenseController.js
const Expense = require("../Schema/AddExpenseSchema");



exports.addExpense = async (req, res) => {
  try {
    const { expensename, expenseamount, expensedesc, type_of_expense, addedBy, addedByRole } = req.body;

    if (!addedBy || !addedByRole) {
      return res.status(400).json({ status: "Failed", message: "Missing user ID or role" });
    }

    const newExpense = new Expense({
      expensename,
      expenseamount,
      expensedesc,
      type_of_expense,
      status: "unpaid",
      approval_status: "waiting",
      addedBy,
      addedByRole,       // ✅ save role
    });

    await newExpense.save();

    res.status(201).json({ status: "Success", message: "Expense added", data: newExpense });
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ status: "Failed", message: error.message });
  }
};




// Treasurer fetches expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "Success", data: expenses });
  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};

// Treasurer updates action
exports.updateAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { approval_status } = req.body; // accepted/rejected

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ status: "Failed", message: "Expense not found" });

    expense.approval_status = approval_status;
    expense.status = approval_status === "accepted" ? "paid" : "unpaid";
    expense.reviewedBy = req.user.id;
    expense.reviewedAt = new Date();

    await expense.save();

    res.status(200).json({ status: "Success", message: "Approval Status updated", data: expense });
  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};


// PATCH /expenses/action/:id
exports.updateExpenseAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { approval_status } = req.body; // accepted / rejected

        if (!["accepted", "rejected"].includes(approval_status)) {
            return res.status(400).json({ status: "Failed", message: "Invalid approval status" });
        }

        const expense = await Expense.findByIdAndUpdate(
            id,
            { approval_status },
            { new: true }
        );

        if (!expense) {
            return res.status(404).json({ status: "Failed", message: "Expense not found" });
        }

        res.status(200).json({ status: "Success", message: `Expense ${approval_status}`, data: expense });
    } catch (err) {
        res.status(500).json({ status: "Failed", message: err.message });
    }
};

exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paidAmount,
      memberId,
      memberName,
      memberPhone,
      nonMemberName,
      nonMemberPhone,
      nonMemberPlace,
    } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ status: "Failed", message: "Expense not found" });
    }

    if (expense.status === "paid") {
      return res.status(400).json({ status: "Failed", message: "Expense already paid" });
    }

    // require at least amount
    if (!paidAmount) {
      return res.status(400).json({ status: "Failed", message: "Amount is required" });
    }

    expense.paidAmount = paidAmount;
    expense.paidAt = new Date();
    expense.status = "paid";

    // save either member or non-member
    if (memberId || memberName) {
      expense.memberId = memberId;
      expense.memberName = memberName;
      expense.memberPhone = memberPhone;
    } else {
      expense.nonMemberName = nonMemberName;
      expense.nonMemberPhone = nonMemberPhone;
      expense.nonMemberPlace = nonMemberPlace;
    }

    await expense.save();

    res.status(200).json({
      status: "Success",
      message: "Expense marked as paid",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};


// controllers/expenseController.js
exports.getPaidExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = { status: "paid" };

    const expenses = await Expense.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await Expense.countDocuments(query);

    res.status(200).json({
      status: "Success",
      data: expenses,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};


// PATCH /expenses/close-bill/:id
exports.closeBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { billName, billNo } = req.body;
    const billFile = req.file ? req.file.path : null;

    if (!billName || !billNo || !billFile) {
      return res.status(400).json({ status: "Failed", message: "Bill name, number, and file are required" });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ status: "Failed", message: "Expense not found" });
    }

    expense.billName = billName;
    expense.billNo = billNo;
    expense.billFile = billFile;
    expense.billStatus = "Closed";

    await expense.save();

    res.status(200).json({ status: "Success", message: "Bill closed successfully", data: expense });
  } catch (err) {
    console.error("Close Bill Error:", err);
    res.status(500).json({ status: "Failed", message: err.message });
  }
};



const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const uploadDir = "uploads/bills";
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
