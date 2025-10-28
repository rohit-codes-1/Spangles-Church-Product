// coupleExpenseRoutes.js

const express = require("express");
const router = express.Router();
const coupleExpenseController = require("../controllers/coupleFellowExpenseController");

// ➕ Add expense
router.post("/add", coupleExpenseController.addExpense);

// 📃 Get all expenses (with optional ?page=&limit=)
router.get("/", coupleExpenseController.getExpenses);

// 👀 Get single expense
router.get("/:id", coupleExpenseController.getExpenseById);

// ✏️ Update expense (approve/reject or edit)
router.put("/:id", coupleExpenseController.updateExpense);

// 💰 Pay expense
router.put("/pay/:id", coupleExpenseController.payExpense);

// ❌ Delete expense
router.delete("/:id", coupleExpenseController.deleteExpense);

// 📌 Close Bill
router.patch(
  "/close-bill/:id",
  coupleExpenseController.uploadBill.single("billFile"),
  coupleExpenseController.closeBill
);

module.exports = router;
