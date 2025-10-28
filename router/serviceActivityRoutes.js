const express = require("express");
const router = express.Router();
const {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity
} = require("../controllers/serviceActivityController");

// POST /api/serviceactivity/activities
router.post("/activities", createActivity);

// GET /api/serviceactivity/activities
router.get("/activities", getActivities);

// GET /api/serviceactivity/activities/:id
router.get("/activities/:id", getActivityById);

// PUT /api/serviceactivity/activities/:id
router.put("/activities/:id", updateActivity);

// DELETE /api/serviceactivity/activities/:id
router.delete("/activities/:id", deleteActivity); 

module.exports = router;
