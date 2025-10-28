const express = require("express");
const router = express.Router();
const { createActivity, getActivities, markAttendance, getAttendanceSummary, updateActivity } = require("../controllers/menActivityController");

// Create Activity
router.post("/", createActivity);
router.get("/", getActivities);


router.put("/:id/attendance", markAttendance); // update attendance
router.get("/:id/attendance-summary", getAttendanceSummary); // summary

router.put("/:id", updateActivity);

module.exports = router;
   