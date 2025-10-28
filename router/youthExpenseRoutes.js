// youthExpenseRoutes.js

const express = require("express");
const router = express.Router();
const youthExpenseController = require("../controllers/youthFellowExpenseController");

// ➕ Add expense
router.post("/add", youthExpenseController.addExpense);

// 📃 Get all expenses (with optional ?page=&limit=)
router.get("/", youthExpenseController.getExpenses);

// 👀 Get single expense
router.get("/:id", youthExpenseController.getExpenseById);

// ✏️ Update expense (approve/reject or edit)
router.put("/:id", youthExpenseController.updateExpense);

// 💰 Pay expense
router.put("/pay/:id", youthExpenseController.payExpense);

// ❌ Delete expense
router.delete("/:id", youthExpenseController.deleteExpense);

// 📌 Close Bill
router.patch(
  "/close-bill/:id",
  youthExpenseController.uploadBill.single("billFile"),
  youthExpenseController.closeBill
);

module.exports = router;
