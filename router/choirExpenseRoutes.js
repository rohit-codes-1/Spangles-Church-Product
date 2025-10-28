// choirExpenseRoutes.js

const express = require("express");
const router = express.Router();
const choirExpenseController = require("../controllers/choirExpenseController");

// ➕ Add expense
router.post("/add", choirExpenseController.addExpense);

// 📃 Get all expenses (with optional ?page=&limit=)
router.get("/", choirExpenseController.getExpenses);

// 👀 Get single expense
router.get("/:id", choirExpenseController.getExpenseById);

// ✏️ Update expense (approve/reject or edit)
router.put("/:id", choirExpenseController.updateExpense);

// 💰 Pay expense
router.put("/pay/:id", choirExpenseController.payExpense);

// ❌ Delete expense
router.delete("/:id", choirExpenseController.deleteExpense);

// 📌 Close Bill
router.patch(
  "/close-bill/:id",
  choirExpenseController.uploadBill.single("billFile"),
  choirExpenseController.closeBill
);

module.exports = router;
