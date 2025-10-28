const express = require("express");
const router = express.Router();
const {
  addHarvestAuction,
  getHarvestAuctions,
  updateHarvestAuction,
  getHarvestAuctionReportByBuyer,
  addHarvestAuctionPayment,
  addHarvestAuctionPaymentForBuyer,
  getHarvestAuctionReportByMember, 
} = require("../controllers/HarvestAuctionController");

// ➤ Routes
router.post("/", addHarvestAuction);
router.get("/", getHarvestAuctions);
router.put("/:id", updateHarvestAuction);

// Report & Payment
router.get("/report/by-buyer", getHarvestAuctionReportByBuyer);
router.post("/payment", addHarvestAuctionPayment);
router.post("/payment/by-buyer", addHarvestAuctionPaymentForBuyer);
router.get("/report/:memberId", getHarvestAuctionReportByMember);

module.exports = router;
