const express = require("express");
const router = express.Router();
const choirController = require("../controllers/choirController");

// Add a new choir member
router.post("/add", choirController.addChoirMember);

// Get all choir members (optional pagination)
router.get("/", choirController.getChoirMembers);

module.exports = router;
