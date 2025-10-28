// routes/expenseRoutes.js
const express = require("express");
const router = express.Router();
const { addExpense, getExpenses, updateAction, updateExpenseAction, markAsPaid, getPaidExpenses, closeBill, uploadBill } = require("../controllers/expenseController");

// accountant adds expense
router.post("/add", addExpense);

// treasurer views all expenses
router.get("/all", getExpenses);

// treasurer accepts/rejects
router.put("/update/:id", updateAction);

router.patch("/action/:id", updateExpenseAction);

router.put("/pay/:id", markAsPaid);

router.get("/paid", getPaidExpenses);

router.patch("/close-bill/:id", uploadBill.single("billFile"), closeBill);

module.exports = router;
