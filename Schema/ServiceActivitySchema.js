const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  title: { type: String, required: true },
  notes: { type: String }
});

const serviceActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["service", "notification"], // identify what kind of record
      required: true
    },
    date: { type: Date, required: true },
    day: { type: String, required: true },
    heading: { type: String }, // only used for "service"
    points: [pointSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceActivity", serviceActivitySchema);
 