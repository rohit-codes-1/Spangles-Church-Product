// routes/bagOfferingRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/bagOfferingController');

// Categories
router.post('/categories', controller.addCategory);
router.get('/categories', controller.getCategories);

// Offerings
router.post('/add', controller.addOffering);
router.get('/category', controller.getOfferingsByCategory);

// route
router.get("/categories/:id", controller.getCategoryById);


module.exports = router;
