const express = require("express");
const {
  addEndeavourAuction,
  getEndeavourAuctions,
  getEndeavourAuctionById,
  updateEndeavourAuction,
  deleteEndeavourAuction,
  searchStudents,
  getEndeavourAuctionReportByBuyer,
  addEndeavourAuctionPayment,
  getTeacherAuctionReportByBuyer,
  getTeacherStudentDues,
} = require("../controllers/endeavourAuctionController");

const router = express.Router();

// CRUD
router.post("/", addEndeavourAuction);
router.get("/", getEndeavourAuctions);

// Payment
router.post("/payment", addEndeavourAuctionPayment);

// Report
router.get("/report/by-buyer", getEndeavourAuctionReportByBuyer);

// Search
router.get("/search-students", searchStudents);

// Single
router.get("/:id", getEndeavourAuctionById);
router.put("/:id", updateEndeavourAuction);
router.delete("/:id", deleteEndeavourAuction);


router.get("/report/by-buyer/teacher/:teacherId", getTeacherAuctionReportByBuyer);

// routes/endeavourAuctionRoutes.js
router.get("/report/student-dues/teacher/:teacherId", getTeacherStudentDues);


module.exports = router;  
