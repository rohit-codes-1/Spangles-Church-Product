const express = require("express");
const router = express.Router();
const {
  addAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  getMenAuctionReportByBuyer,
  addMenAuctionPayment,
} = require("../controllers/MenAuctionController");

// Create
router.post("/add", addAuction);

// Read
router.get("/", getAuctions);
router.get("/:id", getAuctionById);

// Update
router.put("/:id", updateAuction);

// Delete
router.delete("/:id", deleteAuction);


// Buyer Report
router.get("/report/by-buyer", getMenAuctionReportByBuyer);

// Payment
router.post("/payment", addMenAuctionPayment);

module.exports = router;
