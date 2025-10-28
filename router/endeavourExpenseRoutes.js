// endeavourExpenseRoutes.js

const express = require("express");
const router = express.Router();
const endeavourExpenseController = require("../controllers/endeavourExpenseController");

// ➕ Add expense
router.post("/add", endeavourExpenseController.addExpense);

// 📃 Get all expenses (with optional ?page=&limit=)
router.get("/", endeavourExpenseController.getExpenses);

// 👀 Get single expense
router.get("/:id", endeavourExpenseController.getExpenseById);

// ✏️ Update expense (approve/reject or edit)
router.put("/:id", endeavourExpenseController.updateExpense);

// 💰 Pay expense
router.put("/pay/:id", endeavourExpenseController.payExpense);

// ❌ Delete expense
router.delete("/:id", endeavourExpenseController.deleteExpense);

// 📌 Close Bill
router.patch(
  "/close-bill/:id",
  endeavourExpenseController.uploadBill.single("billFile"),
  endeavourExpenseController.closeBill
);

module.exports = router;
