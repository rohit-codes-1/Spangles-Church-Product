const express = require("express");
const {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
  checkAvailability,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", createBooking);
router.get("/", getBookings);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);
router.get("/check", checkAvailability);

module.exports = router;
