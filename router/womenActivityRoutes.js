const express = require("express");
const router = express.Router();
const {
  createActivity,
  getActivities,
  markAttendance,
  getAttendanceSummary,
  updateActivity,
} = require("../controllers/womenActivityController");

// Create Activity
router.post("/", createActivity);

// Get Activities
router.get("/", getActivities);

// Attendance
router.put("/:id/attendance", markAttendance);
router.get("/:id/attendance-summary", getAttendanceSummary);

// Update Activity
router.put("/:id", updateActivity);

module.exports = router;
