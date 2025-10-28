const mongoose = require("mongoose");

const couplesFellowshipSchema = new mongoose.Schema(
  {
    husband: {
      member_id: { type: String, required: true },
      member_name: { type: String, required: true },
      member_tamil_name: { type: String, default: "" },
      mobile_number: { type: String, default: "" },
    },
    wife: {
      member_id: { type: String, required: true },
      member_name: { type: String, required: true },
      member_tamil_name: { type: String, default: "" },
      mobile_number: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CouplesFellowship", couplesFellowshipSchema);
