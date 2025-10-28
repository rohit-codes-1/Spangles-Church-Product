const express = require("express");
const {
  addChoirMaster,
  getChoirMasters,
  updateChoirMasterStatus,
} = require("../controllers/choirMasterController");

const router = express.Router();

// Add Choir Master
router.post("/", addChoirMaster);

// Get Choir Masters (with pagination + search)
router.get("/", getChoirMasters);

// Update Choir Master Status (Active → Inactive only)
router.put("/:id/status", updateChoirMasterStatus);

module.exports = router;
