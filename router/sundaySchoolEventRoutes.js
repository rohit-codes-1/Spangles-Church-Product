// routes/sundaySchoolEventRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/SundaySchoolEventController");

// 🟢 Sunday School Event routes
router.post("/add", controller.addEvent);                     // Add new event
router.get("/", controller.getAllEvents);                    // Get all events
router.get("/:id", controller.getEventById);                // Get single event

// 🟣 Event By routes
router.post("/eventby", controller.addEventBy);             // Add new Event By
router.get("/eventby/all", controller.getAllEventBys);     // Get all Event Bys

// Update event
router.put("/update/:id", controller.updateEvent);

// Events by teacher
router.get("/teacher/:teacherId", controller.getEventsByTeacher);

// Participants routes
router.post("/add-participants", controller.addParticipants);
router.put("/update-participants", controller.updateParticipants);
router.get("/participants", controller.getParticipants);

// Prizes
router.put("/add-prizes", controller.addPrizes);

// Teachers
router.post("/add-teachers", controller.addTeachers);

// Update Event Bys
router.put("/eventby/update", controller.updateEventBys);

// Teacher participants & prizes
router.put("/update-teacher-participants", controller.updateTeacherParticipants);
router.put("/add-prizes-teacher", controller.addPrizesForTeacher);
router.get("/teacher-participants", controller.getTeacherParticipants);

module.exports = router;
