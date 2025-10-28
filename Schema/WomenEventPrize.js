const mongoose = require("mongoose");

const WomenEventPrizeSchema = new mongoose.Schema({
  prizes: [String],
}, { timestamps: true });

module.exports = mongoose.model("WomenEventPrize", WomenEventPrizeSchema);
