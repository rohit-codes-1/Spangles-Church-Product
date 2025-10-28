// routes/endeavourAttendanceRoutes.js
const express = require("express");
const router = express.Router();
const {
  addAttendance,
  updateAttendance,
  getAttendance,
} = require("../controllers/endeavourAttendanceController");

// CRUD routes
router.post("/", addAttendance);
router.put("/:id", updateAttendance);
router.get("/", getAttendance);

// Status by date
router.get("/status", async (req, res) => {
  try {
    const { date } = req.query;
    const records = await require("../Schema/EndeavourAttendance").find({ date });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance status" });
  }
});

module.exports = router; 
