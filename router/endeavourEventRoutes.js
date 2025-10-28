const express = require("express");
const router = express.Router();
const controller = require("../controllers/endeavourEventController");

// 🟢 Event routes
router.post("/add", controller.addEvent);
router.get("/", controller.getAllEvents);
router.get("/:id", controller.getEventById);

// 🟣 Event By routes
router.post("/eventby", controller.addEventBy);
router.get("/eventby/all", controller.getAllEventBys);

router.put("/update/:id", controller.updateEvent);

router.get("/teacher/:teacherId", controller.getEventsByTeacher);


router.post("/add-participants", controller.addParticipants);

router.put("/update-participants", controller.updateParticipants);

// routes/endeavourEventRoutes.js
router.get("/participants", controller.getParticipants);

router.put("/add-prizes", controller.addPrizes);

router.post("/add-teachers", controller.addTeachers);

router.put("/eventby/update", controller.updateEventBys);

// existing imports...
router.put("/update-teacher-participants", controller.updateTeacherParticipants);
router.put("/add-prizes-teacher", controller.addPrizesForTeacher);
router.get("/teacher-participants", controller.getTeacherParticipants);



module.exports = router;
