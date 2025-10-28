const mongoose = require("mongoose");

const ChoirMemberSchema = new mongoose.Schema(
  {
    member_id: { type: String, required: true, unique: true },
    member_name: { type: String, required: true },
    member_tamil_name: { type: String },
    mobile_number: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChoirMember", ChoirMemberSchema);
