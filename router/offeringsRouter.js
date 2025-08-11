const express = require('express');
const router = express.Router();
const offeringsController = require('../controllers/Offerings');

// Define routes for Offerings
router.post('/add', offeringsController.addOffering);
router.get('/categories', offeringsController.getDistinctCategories);
router.get("/trend", offeringsController.getMonthlyTotals);
router.get('/member/verify/:id', offeringsController.verifyMember);
router.get('/category', offeringsController.getOfferingsByCategoryAndDate);
router.get('/category/Marriage', offeringsController.getMarriageOfferingsByCategoryAndDate);


router.post('/by-members', offeringsController.getOfferingsByMemberIds);
router.get('/bill/family-heads', offeringsController.getFamilyHeadsWithOfferings);
router.get("/bill/family-heads", offeringsController.getSortedFamilyHeads);
router.get('/bill/overall', offeringsController.getOverallFamilyOfferings);


module.exports = router;
