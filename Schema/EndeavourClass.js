const mongoose = require("mongoose");

const EndeavourClassSchema = new mongoose.Schema({
  class_name: { type: String, required: true },
  section_name: { type: String, required: true },
  year_from: { type: Date, required: true },
  year_to: { type: Date, required: true },
  teacher: {
    member_id: { type: String, required: true },
    name: { type: String, required: true },
    tamil_name: { type: String },
  },
  students: [
    {
      member_id: { type: String, required: true },
      member_name: { type: String, required: true }, 
      tamil_name: { type: String },
      date_of_birth: { type: Date },
      parent_name: { type: String },
      address: { type: String },
    },
  ],
  max_students: { type: Number, required: true },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("EndeavourClass", EndeavourClassSchema);
 