const mongoose = require("mongoose");


const familyMemberSchema = new mongoose.Schema(
  {
    primary_family_id: { type: String, ref: "Family" },
    secondary_family_id: { type: String, default: null },

    member_id: { type: String, unique: true },
    member_type:{ type: String, enum: ["Full Member", "Half Member", "Supporting Member"] },
    assigned_member_id: { type: String },
    mobile_number: { type: String },

    member_name: { type: String },
    member_tamil_name: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    date_of_birth: { type: Date },
    age: { type: Number, default: null },   // ✅ NEW

    relationship_with_family_head: {
      type: String,
      enum: ["Wife", "Son", "Daughter"],
      default: null,
    },

    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
    },
    occupation: { type: String },
    community: { type: String },
    nationality: { type: String },
    member_photo: { type: String },

    permanent_address: {},
    present_address: {},

    // Baptism
    baptized_date: { type: Date },
    baptism_status: { type: String, enum: ["Yes", "No", null], default: "No" },
    baptism_place: { type: String, default: null },
    baptism_by: { type: String, default: null }, // ✅ NEW

    // Communion
    communion: { type: String, enum: ["Yes", "No", null], default: "No" }, // ✅ NEW
    communion_date: { type: Date, default: null },
    communion_place: { type: String, default: null }, // ✅ NEW
    communion_by: { type: String, default: null },   // ✅ NEW

    // Confirmation
    confirmation_status: { type: String, enum: ["Yes", "No", null], default: "No" },
    confirmation_date: { type: Date, default: null },
    confirmation_place: { type: String, default: null }, // ✅ NEW
    confirmation_by: { type: String, default: null },   // ✅ NEW

    // Marriage
    marriage_date: { type: Date, default: null },
    marital_status: { type: String, enum: ["Married", "Unmarried"], default: "Unmarried" },
    marriage_place: { type: String, default: null },
    wife_father_name: { type: String, default: null },  // ✅ NEW
    wife_mother_name: { type: String, default: null },  // ✅ NEW

    // Family Info
    father_name: { type: String, default: null },
    mother_name: { type: String, default: null },
    family_head_name: { type: String, default: null }, // ✅ NEW
    place_of_birth: { type: String, default: null },

    // Other personal
    blood_group: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      default: null,
    },
    qualification: { type: String, default: null },
    aadhar_number: { type: String, default: null },

    // Status & Tracking
    joined_date: { type: Date },
    left_date: { type: Date },
    reason_for_inactive: { type: String, default: null },
    description: { type: String, default: null },
    rejoining_date: { type: String, default: null },
    reason_for_rejoining: { type: String, default: null },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },

    // Dual Membership
    dual_member: { type: String, enum: ["yes", "no"], default: "no" },
    church_name: { type: String },
    dual_member_id: { type: String },
    dual_member_certificate: { type: String }, // store file path or filename
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", familyMemberSchema);

module.exports = Member;
