const express = require("express");
const router = express.Router();
const cemeteryController = require("../controllers/cemeteryController");

// ➕ Add cemetery
router.post("/add", cemeteryController.addCemetery);

// 📃 Get all cemeteries
router.get("/", cemeteryController.getCemeteries);

// 👀 Get single cemetery
router.get("/:id", cemeteryController.getCemeteryById);

// ✏️ Update cemetery
router.put("/:id", cemeteryController.updateCemetery);

// ❌ Delete cemetery
router.delete("/:id", cemeteryController.deleteCemetery);

module.exports = router;
