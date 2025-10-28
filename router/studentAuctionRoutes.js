// routes/studentAuctionRoutes.js
const express = require("express");
const {
  addStudentAuction,
  getStudentAuctions,
  getStudentAuctionById,
  updateStudentAuction,
  deleteStudentAuction,
  searchStudents,
  getStudentAuctionReportByBuyer,
  addStudentAuctionPayment,   // <-- ✅ import
  getTeacherStudentDues
} = require("../controllers/studentAuctionController");

const router = express.Router();

// CRUD
router.post("/", addStudentAuction);
router.get("/", getStudentAuctions);

// 👇 Payment route must come BEFORE "/:id"
router.post("/payment", (req, res, next) => {
  console.log("✅ /payment route hit");
  next();
}, addStudentAuctionPayment);


// Report
router.get("/report/by-buyer", getStudentAuctionReportByBuyer);

// Search
router.get("/search-students", searchStudents);

router.get("/:id", getStudentAuctionById); 
router.put("/:id", updateStudentAuction);
router.delete("/:id", deleteStudentAuction);

router.get("/report/student-dues/teacher/:teacherId", getTeacherStudentDues);

module.exports = router;
