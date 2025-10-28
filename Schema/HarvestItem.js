// Schema/HarvestItem.js
const mongoose = require("mongoose");

const HarvestItemSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HarvestItem", HarvestItemSchema);
