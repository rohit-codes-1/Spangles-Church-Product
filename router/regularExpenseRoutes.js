const express = require("express");
const router = express.Router();
const { addExpense, getExpenses, updateExpense, getActiveRegularExpenses } = require("../controllers/regularExpenseController");

router.post("/add", addExpense);
router.get("/all", getExpenses);
router.put("/update/:id", updateExpense);
router.get("/active-regular", getActiveRegularExpenses);


module.exports = router;
