const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  deleteCategory,
} = require("../controllers/categoryController");

// POST /api/categories
router.post("/", createCategory);

// GET /api/categories
router.get("/", getCategories);

// DELETE /api/categories/:id
router.delete("/:id", deleteCategory);

module.exports = router;
