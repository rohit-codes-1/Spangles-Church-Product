const express = require("express");
const router = express.Router();
const { getSundayClassTags, updateSundayClassTags } = require("../controllers/SundayClassTagController");

// GET all Sunday class tags
router.get("/", getSundayClassTags);

// PUT update (add/remove) Sunday class tags
router.put("/update", updateSundayClassTags);

module.exports = router;
