const mongoose = require("mongoose");

const cemeterySchema = new mongoose.Schema({
  cemetery_name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  manager: {
  _id: String,
  member_id: String,
  member_name: String,
},

  slots: {
    type: [[String]], // 2D array: rows of slot IDs like ["A1", "B1"]
    default: [],
  },
  number_of_available_slots: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Cemetery", cemeterySchema);
