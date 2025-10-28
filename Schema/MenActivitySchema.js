// models/MenActivity.js
const mongoose = require("mongoose");

const HouseSchema = new mongoose.Schema({
  id: { type: String, default: "-" }, // Member ID or "-" for non-member
  name: String,
  address: String,
  isMember: { type: Boolean, default: true },
  offering: { type: Number, default: 0 },
});

const AttendeeSchema = new mongoose.Schema({
  id: { type: String, default: "-" }, // Member ID or "-" for non-member
  name: String,
  isMember: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ["present", "absent"], 
    default: "absent" 
  },
});

const MenActivitySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    activityType: {
      type: String,
      enum: ["house-visit", "weekly-prayer", "church-prayer", "other"],
      required: true,
    },
    title: { type: String }, // weekly prayer
    churchName: { type: String }, // church prayer
    churchLocation: { type: String }, // church prayer
    customTitle: { type: String }, // other
    leader: {
      id: { type: String, default: "-" },
      name: String,
    },
    notes: { type: String },
    houses: [HouseSchema], // only for house-visit
    attendees: [AttendeeSchema],
    totalOffering: { type: Number, default: 0 }, 
    status: {
      type: String,
      enum: ["Planned", "Completed", "Cancelled"],
      default: "Planned",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenActivity", MenActivitySchema);
