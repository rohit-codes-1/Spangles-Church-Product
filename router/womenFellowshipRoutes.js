const express = require("express");
const router = express.Router();
const {
  addWomenFellowshipMember,
  getWomenFellowshipMembers,
} = require("../controllers/WomenFellowshipController");

// ➕ Add Women’s Fellowship member
router.post("/", addWomenFellowshipMember);

// 📋 Get Women’s Fellowship members
router.get("/", getWomenFellowshipMembers);

module.exports = router;
