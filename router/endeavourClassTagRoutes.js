const express = require("express");
const router = express.Router();
const { getClassTags, updateClassTags } = require("../controllers/EndeavourClassTagController");

// GET all tags
router.get("/", getClassTags);

// PUT update (add/remove) tags
router.put("/update", updateClassTags);

module.exports = router;
