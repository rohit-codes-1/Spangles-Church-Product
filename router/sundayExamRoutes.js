const express = require("express");
const router = express.Router();
const {
  createSundayExam,
  getSundayExams,
  getSundayExamById,
  updateExamBy,
  getExamByList,
  addExamBy,
  updateSundayExam,
  getExamsByTeacher,
  addExamParticipants,
  addMarks,
  addTeacher,
  updateMarks,
} = require("../controllers/sundayExamController");

// Exam routes
router.post("/create", createSundayExam);
router.get("/all", getSundayExams);
router.get("/:id", getSundayExamById);
 
router.post("/examby", addExamBy);
router.put("/examby/update", updateExamBy);
router.get("/examby/all", getExamByList);

router.put("/update/:id", updateSundayExam);

router.get("/teacher/:teacherId", getExamsByTeacher);

router.post("/add-participants", addExamParticipants);

router.post("/add-marks", addMarks);

router.post("/add-teachers", addTeacher);

router.put("/update-marks", updateMarks);



module.exports = router;
