const mongoose = require("mongoose");

const SundayClassTagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SundayClassTag", SundayClassTagSchema);
