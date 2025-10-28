// routes/womenEventRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/WomenEventController");

// 🟢 Women Events Routes

// Event CRUD
router.post("/add", controller.addEvent); // Add new event
router.get("/all", controller.getAllEvents); // Get all events (pagination/search/date)
router.get("/:id", controller.getEventById); // Get single event
router.put("/update/:id", controller.updateEvent); // Update event

// Event By (organizer)
router.post("/eventBy/add", controller.addEventBy); // Add new Event By
router.get("/eventBy/all", controller.getAllEventBys); // Get all Event Bys
router.put("/eventBy/update", controller.updateEventBys); // Update all Event Bys (replace)


// Participants management
router.post("/participants/add", controller.addParticipants); // Add participants to group/competition
router.put("/participants/update", controller.updateParticipants); // Update participants
router.get("/participants/get", controller.getParticipants); // Get participants by eventId/groupName/competitionId

// Prizes management
router.put("/prizes/add", controller.addPrizes); // Add/update prizes for participants

module.exports = router;
