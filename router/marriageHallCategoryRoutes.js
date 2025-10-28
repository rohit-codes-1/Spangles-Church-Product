const express = require("express");
const { createCategory } = require("../controllers/marriageHallCategoryController");
const { getCategories } = require("../controllers/marriageHallCategoryController");

const router = express.Router();

router.post("/", createCategory); // create global category

router.get("/", getCategories);

module.exports = router;
