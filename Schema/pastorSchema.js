const mongoose = require("mongoose");

const pastorMemberSchema = new mongoose.Schema(
  {
    familyhead_id: { type: String, unique: true, sparse: true },
    familyId: {
      type: String,
      required: true,
    },
    relationship_with_family_head: { type: String, required: true ,default:"head"},

    member_id: {
      type: String,
      unique: true,
    },
    mobile_number: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"],
    },

    member_name: {
      type: String,
    },
    member_tamil_name: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    }, 
    date_of_birth: {
      type: Date,
    },
    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
    },
    husband_name: { type: String, default: null },   // ✅ new
    father_name: { type: String, default: null },  
    occupation: {
      type: String,
    },
    community: {
      type: String,
    },
    nationality: {
      type: String,
    },
    member_photo: {
      type: String,
    },
    permanent_address: { type: String },
    present_address: { type: String },


    joined_date: {
      type: Date,
    }, 
    marriage_date: {
      type: Date,
    },
    pastor_role: { type: String, enum: ["Primary", "Secondary"], required: true },
    age: { type: Number },
    aadhar_number: {
      type: String,
      required: false,
      trim: true,
      match: [/^\d{4}\s\d{4}\s\d{4}$/, "Invalid Aadhar Number format"], // Optional validation
    },
    reason_for_inactive: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const pastorMember = mongoose.model("pastorMember", pastorMemberSchema);

module.exports = pastorMember;
