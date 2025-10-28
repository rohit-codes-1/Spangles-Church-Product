// menFellowExpenseRoutes.js

const express = require("express");
const router = express.Router();
const menFellowExpenseController = require("../controllers/menFellowExpenseController");

// ➕ Add expense
router.post("/add", menFellowExpenseController.addExpense);

// 📃 Get all expenses (with optional ?page=&limit=)
router.get("/", menFellowExpenseController.getExpenses);

// 👀 Get single expense
router.get("/:id", menFellowExpenseController.getExpenseById);

// ✏️ Update expense (approve/reject or edit)
router.put("/:id", menFellowExpenseController.updateExpense);

// 💰 Pay expense
router.put("/pay/:id", menFellowExpenseController.payExpense);

// ❌ Delete expense
router.delete("/:id", menFellowExpenseController.deleteExpense);

// 📌 Close Bill
router.patch(
  "/close-bill/:id",
  menFellowExpenseController.uploadBill.single("billFile"),
  menFellowExpenseController.closeBill
);

module.exports = router;
