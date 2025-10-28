// models/BagOfferingCategory.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BagOfferingCategorySchema = new Schema({
  category: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const BagOfferingCategory = mongoose.model('BagOfferingCategory', BagOfferingCategorySchema);
module.exports = BagOfferingCategory;
