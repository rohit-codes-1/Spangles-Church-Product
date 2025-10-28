// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/DashboardController");

router.get("/offerings/:member_id", controller.getOfferingsByMember);
router.get("/member-name/:member_id", controller.getMemberName);
router.get("/family-head/:memberId", controller.getFamilyIfHead);
router.get("/family-member/:memberId", controller.getFamilyByMember);
router.get("/subscriptions/:member_id", controller.getSubscriptionsByMember);

module.exports = router;
