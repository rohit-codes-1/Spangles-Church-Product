const mongoose = require("mongoose");

const WomenFellowshipSchema = new mongoose.Schema(
  {
    member_id: { type: String, required: true },
    member_name: { type: String, required: true },
    member_tamil_name: { type: String },
    mobile_number: { type: String }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("WomenFellowship", WomenFellowshipSchema);
