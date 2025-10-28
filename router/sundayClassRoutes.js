const express = require("express");
const router = express.Router();
const sundayClassController = require("../controllers/sundayClassController");
const Member = require("../Schema/memberSchema");

// Create new class
router.post("/", sundayClassController.createClass);

// Get all classes
router.get("/", sundayClassController.getClasses);

// Update class
router.put("/:id", sundayClassController.updateSundayClass);

// Delete class
router.delete("/:id", sundayClassController.deleteClass);



// Teachers with classes
router.get("/teachers-with-classes", sundayClassController.getTeachersWithClasses);

// Teachers with details (✅ this is the one you need in Teacher.jsx)
router.get("/teachers/details", sundayClassController.getTeachersWithDetails);

// sundayClassRoutes.js
router.get("/:classId/students/eligible", sundayClassController.getEligibleStudents);

router.post("/:classId/students", sundayClassController.addStudentsToClass);
router.get("/:classId/details", sundayClassController.getClassWithStudents);

router.get(
  "/teacher/:teacherId/students",
  sundayClassController.getStudentsByTeacher 
);

router.get("/event/groups", sundayClassController.getEventClassGroups);


module.exports = router; 
