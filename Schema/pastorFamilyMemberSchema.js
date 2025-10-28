const mongoose = require("mongoose");

const pastorFamilyMemberSchema = new mongoose.Schema(
  {
    familyId: { type: String, required: true }, // Added familyId field for consistency
    familyhead_id: { type: String, }, // Removed unique constraint
    primary_family_id: { type: String }, // Removed ref unless it references another model
    member_id: { type: String, unique: true, required: true },
    assigned_member_id: { type: String, default: null },


    mobile_number: { type: String, required: true },
    relationship_with_family_head: { type: String,  required: true,},


    member_name: { type: String, required: true },
    member_tamil_name: { type: String },


    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    date_of_birth: { type: Date },
    age: { type: Number },

    aadhar_number: { type: String },
    email: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
    },

    
    member_photo: { type: String },

    permanent_address: { type: String },
    present_address: { type: String },

    marriage_date: { type: Date, default: null },
    joined_date: { type: Date, default: Date.now },
    left_date: { type: Date, default: null },
    reason_for_inactive: { type: String, default: null }, 
    description: { type: String, default: null },

    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

const PastorFamilyMember = mongoose.model("PastorFamilyMember", pastorFamilyMemberSchema);

module.exports = PastorFamilyMember;
