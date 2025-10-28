const express = require("express");
const router = express.Router();
const { addPrizes, getPrizes } = require("../controllers/EndeavourPrize");

router.post("/add", addPrizes);
router.get("/list", getPrizes);

module.exports = router;
 