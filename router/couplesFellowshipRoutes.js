const express = require("express");
const router = express.Router();
const { addCoupleMember, getCoupleMembers } = require("../controllers/couplesFellowshipController");

// ➤ Add new couple member
router.post("/", addCoupleMember);

// ➤ Get all couple members
router.get("/", getCoupleMembers);

module.exports = router;
