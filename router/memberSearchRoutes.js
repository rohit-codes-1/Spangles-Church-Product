const express = require("express");
const router = express.Router();
const { searchMembers, searchMembersById, searchMembersUnified, searchMaleMembers, searchMaleMembersById, searchFemaleMembers, searchFemaleMembersById, searchMarriedHusbands, getSpouse, searchMenFellowshipByName, searchMenFellowshipById, searchWomenFellowshipByName, searchWomenFellowshipById, searchYouthFellowshipByName, searchYouthFellowshipById, searchTeacherById, searchTeacherByName } = require("../controllers/memberSearchController");

// ✅ New route for member search
router.get("/", searchMembers);
router.get("/by-id", searchMembersById);
router.get("/search", searchMembersUnified);

// ✅ Male member search
router.get("/male", searchMaleMembers);           
router.get("/male/by-id", searchMaleMembersById); 

// ✅ Female
router.get("/female", searchFemaleMembers);
router.get("/female/by-id", searchFemaleMembersById);

router.get("/married-husbands", searchMarriedHusbands); // for dropdown
router.get("/get-spouse", getSpouse); // fetch spouse after selecting head);

router.get("/men-fellowship", searchMenFellowshipByName);
router.get("/men-fellowship/by-id", searchMenFellowshipById);

router.get("/women-fellowship", searchWomenFellowshipByName);
router.get("/women-fellowship/by-id", searchWomenFellowshipById); 

// ✅ Youth Fellowship
router.get("/youth-fellowship", searchYouthFellowshipByName);
router.get("/youth-fellowship/by-id", searchYouthFellowshipById);

router.get("/teachers/by-id", searchTeacherById);
router.get("/teachers/by-name", searchTeacherByName);

module.exports = router;
