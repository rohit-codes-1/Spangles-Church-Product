const express = require("express");
const router = express.Router();
const {
  addAuction,
  getAuctions,
  getAuctionById,
  updateAuction,
  deleteAuction,
  getYouthAuctionReportByBuyer,
  addYouthAuctionPayment,
} = require("../controllers/youthAuctionController");

// ➤ Create
router.post("/add", addAuction);

// ➤ Read
router.get("/", getAuctions);
router.get("/:id", getAuctionById);

// ➤ Update
router.put("/:id", updateAuction);

// ➤ Delete
router.delete("/:id", deleteAuction);

// ➤ Buyer Report
router.get("/report/by-buyer", getYouthAuctionReportByBuyer);

// ➤ Payment
router.post("/payment", addYouthAuctionPayment);

module.exports = router;
