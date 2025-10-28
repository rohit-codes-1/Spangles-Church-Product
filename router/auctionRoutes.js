const express = require("express");
const router = express.Router();
const { createAuction, getAuctions, getAuctionById, getAuctionReport, getAuctionReportByBuyer, addPayment, getBuyerPaymentHistory  } = require("../controllers/auctionController");

// POST new auction
router.post("/", createAuction);

// GET all auctions
router.get("/", getAuctions);

// GET single auction
router.get("/:id", getAuctionById);

// GET auctions grouped by seller (for reports)
router.get("/report/all", getAuctionReport);

// GET auctions grouped by buyer
router.get("/report/buyer", getAuctionReportByBuyer);

// ✅ Add payment for seller (partial/full)
router.post("/payment", addPayment);

// GET buyer payment history
router.get("/payment/history", getBuyerPaymentHistory);


module.exports = router;
