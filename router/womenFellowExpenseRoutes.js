const express = require("express");
const router = express.Router();
const womenFellowExpenseController = require("../controllers/womenFellowExpenseController");

// ➕ Add expense
router.post("/add", womenFellowExpenseController.addExpense);

// 📃 Get all expenses (with optional ?page=&limit=)
router.get("/", womenFellowExpenseController.getExpenses);

// 👀 Get single expense
router.get("/:id", womenFellowExpenseController.getExpenseById);

// ✏️ Update expense (approve/reject or edit)
router.put("/:id", womenFellowExpenseController.updateExpense);

// 💰 Pay expense
router.put("/pay/:id", womenFellowExpenseController.payExpense);

// ❌ Delete expense
router.delete("/:id", womenFellowExpenseController.deleteExpense);

// 📌 Close Bill
router.patch(
  "/close-bill/:id",
  womenFellowExpenseController.uploadBill.single("billFile"),
  womenFellowExpenseController.closeBill
);

module.exports = router;
