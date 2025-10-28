// routes/endeavourClassRouter.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/EndeavourClassController");

// ➤ Class CRUD
router.post("/", controller.createClass);
router.get("/", controller.getClasses);
router.put("/:id", controller.updateClass);
router.delete("/:id", controller.deleteClass);

// ➤ Teacher-related
router.get("/teachers", controller.getTeachersWithClasses);
router.get("/teachers/details", controller.getTeachersWithDetails);

// ➤ Student-related
router.get("/:classId/eligible-students", controller.getEligibleStudents);
router.post("/:classId/students", controller.addStudentsToClass);
router.get("/:classId/students", controller.getClassWithStudents);

router.get("/teacher/:teacherId/students", controller.getStudentsByTeacher);

router.get("/event/groups", controller.getEventClassGroups);


module.exports = router;  
 