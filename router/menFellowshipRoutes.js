const express = require("express");
const router = express.Router();
const { addMenFellowshipMember, getMenFellowshipMembers } = require("../controllers/MenFellowshipController");

router.post("/", addMenFellowshipMember);   // ➕ Add member
router.get("/", getMenFellowshipMembers);  // 📋 List members

module.exports = router;
