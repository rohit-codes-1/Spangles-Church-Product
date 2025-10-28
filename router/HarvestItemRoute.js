// Routes/HarvestItemRoute.js
const express = require("express");
const {
  addHarvestItem,
  getHarvestItems,
  updateHarvestItem,
} = require("../controllers/HarvestItemController");

const router = express.Router();

router.post("/", addHarvestItem);
router.get("/", getHarvestItems);
router.put("/:id", updateHarvestItem);

module.exports = router;
