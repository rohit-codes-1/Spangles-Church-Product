const mongoose = require("mongoose");

const marriageHallCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarriageHallCategory", marriageHallCategorySchema);
