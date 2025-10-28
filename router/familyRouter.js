const express = require("express");
const register = require("../controllers/Register");
const Member_path = require("../controllers/Member");
const Family_path = require("../controllers/Family");
const multer = require("multer");
const router = express.Router();
const path = require("path");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get("/list", Family_path.getMembers);
router.get("/download-list", Family_path.downloadMembers);
router.get("/tree/list/:id", Family_path.treeMembers);
router.get("/familyTreeMembers", Family_path.familyTreeMembers);
// router.get("/head/:id", Family_path.SingleGetMemberById);
router.get("/:id", Family_path.getFamilyById);
router.get("/:id/full", Family_path.getFullFamilyById);

router.post("/generate-member-id", Family_path.generateMemberId);


router.post("/add/new", upload.single("member_photo"), register.NewFamily);

router.post(
  "/:id/member/add/new",
  upload.single("member_photo"),
  register.NewMember
);
router.get("/head/:id", Family_path.getFamilyById);

module.exports = router;
