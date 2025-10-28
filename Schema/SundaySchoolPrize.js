const mongoose = require("mongoose");

const SundaySchoolPrizeSchema = new mongoose.Schema({
  prizes: [String],
}, { timestamps: true });

module.exports = mongoose.model("SundaySchoolPrize", SundaySchoolPrizeSchema);
