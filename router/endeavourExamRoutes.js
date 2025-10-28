// routes/endeavourExamRoutes.js
const express = require("express");
const router = express.Router();
const {
  createEndeavourExam,
  getEndeavourExams,
  getEndeavourExamById,
  updateEndeavourExamBy,
  getEndeavourExamByList,
  addEndeavourExamBy,
  updateEndeavourExam,
  getEndeavourExamsByTeacher,
  addEndeavourExamParticipants,
  addEndeavourMarks,
  addEndeavourTeacher,
  updateEndeavourMarks,
} = require("../controllers/endeavourExamController");

// Exam routes
router.post("/create", createEndeavourExam);
router.get("/all", getEndeavourExams);
router.get("/:id", getEndeavourExamById);

// Exam By (organizers)
router.post("/examby", addEndeavourExamBy);
router.put("/examby/update", updateEndeavourExamBy);
router.get("/examby/all", getEndeavourExamByList);

// Update exam
router.put("/update/:id", updateEndeavourExam);

// Teacher-specific exams
router.get("/teacher/:teacherId", getEndeavourExamsByTeacher);

// Participants
router.post("/add-participants", addEndeavourExamParticipants);

// Marks
router.post("/add-marks", addEndeavourMarks);
router.put("/update-marks", updateEndeavourMarks);

// Teachers
router.post("/add-teachers", addEndeavourTeacher);

module.exports = router;
