const mongoose = require("mongoose");

const EndeavourPrizeSchema = new mongoose.Schema({
  prizes: [String],
}, { timestamps: true });

module.exports = mongoose.model("EndeavourPrize", EndeavourPrizeSchema);
 