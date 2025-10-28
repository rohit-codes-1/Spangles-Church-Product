const express = require("express");
const router = express.Router();
const {
  addAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  getWomenAuctionReportByBuyer,
  addWomenAuctionPayment,
} = require("../controllers/WomenAuctionController");

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
router.get("/report/by-buyer", getWomenAuctionReportByBuyer);

// Payment
router.post("/payment", addWomenAuctionPayment);

module.exports = router;
