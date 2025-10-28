// models/BagOffering.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BagOfferingSchema = new Schema({
  category: { type: String, required: true }, // category name
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  day: { type: String, required: true },
  description: { type: String,  },
}, { timestamps: true });

const BagOffering = mongoose.model('BagOffering', BagOfferingSchema);
module.exports = BagOffering;
