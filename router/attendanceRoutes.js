const express = require("express");
const router = express.Router();
const Attendance = require("../Schema/Attendance");
const {
  addAttendance,
  updateAttendance,
  getAttendance,
} = require("../controllers/attendanceController");

// Add new attendance
router.post("/", addAttendance);

// Update attendance
router.put("/:id", updateAttendance);

// Get attendance (by class/date)
router.get("/", getAttendance);

// GET /attendance/status?date=2025-08-26
router.get("/status", async (req, res) => {
  try {
    const { date } = req.query;
    const records = await Attendance.find({ date });
    res.json(records); // send back which classes are marked
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance status" });
  }
});
 

module.exports = router;
