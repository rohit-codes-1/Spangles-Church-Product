//sundaySchoolExpenseRoutes.js

const express = require("express");
const router = express.Router();
const sundaySchoolExpenseController = require("../controllers/sundaySchoolExpenseController");

// Add expense
router.post("/add", sundaySchoolExpenseController.addExpense);

// Get all expenses (with optional ?page=&limit=)
router.get("/", sundaySchoolExpenseController.getExpenses);

// Get single expense
router.get("/:id", sundaySchoolExpenseController.getExpenseById);

// Update expense (approve/reject or edit)
router.put("/:id", sundaySchoolExpenseController.updateExpense);

// Pay expense
router.put("/pay/:id", sundaySchoolExpenseController.payExpense);

// Delete expense
router.delete("/:id", sundaySchoolExpenseController.deleteExpense);

router.patch("/close-bill/:id", sundaySchoolExpenseController.uploadBill.single("billFile"), sundaySchoolExpenseController.closeBill);

module.exports = router;
