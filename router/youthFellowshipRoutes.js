const express = require("express");
const router = express.Router();
const YouthFellowshipController = require("../controllers/YouthFellowshipController");

// ➤ Add a new youth member
router.post("/", YouthFellowshipController.addYouthMember);

// ➤ Get all youth members
router.get("/", YouthFellowshipController.getYouthMembers);

module.exports = router;
