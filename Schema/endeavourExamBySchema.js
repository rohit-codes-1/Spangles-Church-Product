// schema/endeavourExamBySchema.js
const mongoose = require("mongoose");

const endeavourExamBySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EndeavourExamBy", endeavourExamBySchema);
