const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pastorMemberController = require("../controllers/pastorMemberController");

// Ensure "uploads/pastor" folder exists
const uploadDir = path.join(__dirname, "../uploads/pastor");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `img_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/pastor/"); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// const upload1 = multer({ storage: storage1 });

const upload1 = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});


const upload = multer({ storage });

// Routes
router.post(
  "/",
  upload.single("member_photo"),
  pastorMemberController.createMember
);
router.put(
  "/:id",
  upload.single("member_photo"),
  pastorMemberController.updateMember
);

router.get("/list", pastorMemberController.getAllMembers);
router.get("/download-list", pastorMemberController.getAllMembers);
router.get("/familymembers", pastorMemberController.getMembersWithFamilyHeadId);
router.get("/family/:familyId", pastorMemberController.getFamilyData);
router.get("/:id", pastorMemberController.getMemberById);
router.delete("/:id", pastorMemberController.deleteMember);
// router.post("/add/new", pastorMemberController.createfamilyMember);
// pastorMemberController.createfamilyMember
// router.post("/add/new", 
//   upload1.single("member_photo"), 

//   // console.log(req.body); // Should now contain text fields
//   pastorMemberController.createfamilyMember
//   // console.log(req.file); // Should now contain file data
// );
router.post("/add/pastor", upload1.single("member_photo"), pastorMemberController.createMember)

router.post(
  "/add/new",
  express.json(),  // Parse JSON body
  express.urlencoded({ extended: true }), // Parse URL-encoded data
  upload1.single("member_photo"),  // Ensure it matches the frontend key
  (req, res, next) => {
    console.log("Received Data:", req.body); // Debugging: Check request body
    console.log("Uploaded File:", req.file); // Debugging: Check file
    next();
  },
  pastorMemberController.createfamilyMember
);

router.get("/download-list", pastorMemberController.downloadPastorList);



module.exports = router;
