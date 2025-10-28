const express = require("express");
const router = express.Router();
const { addSubscription, getSubscribers, getMemberSubscriptions, checkSubscription } = require("../controllers/SubscriptionController");

// ➤ Add a new subscription
router.post("/", addSubscription);

// You can add more routes later if needed (e.g., get all subscriptions, update, etc.)
router.get("/", getSubscribers);

router.get("/member", getMemberSubscriptions);

router.post("/check", checkSubscription);

module.exports = router;
