const express = require("express");
const router = express.Router();
const { addPrizes, getPrizes } = require("../controllers/SundaySchoolPrize");

// Add prizes
router.post("/add", addPrizes);

// Get prizes list
router.get("/list", getPrizes);

module.exports = router;
