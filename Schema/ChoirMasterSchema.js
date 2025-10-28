const mongoose = require("mongoose");

const ChoirMasterSchema = new mongoose.Schema(
  {
    isMember: { type: Boolean, required: true },

    // For Members
    memberId: { type: String },
    memberName: { type: String },
    phone: { type: String },
    present_address: { type: String },
    aadhar_number: { type: String },

    // For Non-Members
    nonMemberName: { type: String },
    nonMemberPhone: { type: String },
    nonMemberAadhar: { type: String },

    // Status tracking
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    createdAt: { type: Date, default: Date.now },
    inactiveDate: { type: Date },
    inactiveReason: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChoirMaster", ChoirMasterSchema);
