const mongoose = require("mongoose");

// ✅ Inner competition schema
const competitionSchema = new mongoose.Schema({
  competition: { type: String, required: true },
  title: { type: String, required: true },
  participants: [
    {
      member_id: { type: String, required: true },
      member_name: { type: String, required: true },
      class_name: { type: String, required: true },
      section_name: { type: String, required: true },
      prize: { type: String, trim: true, default: "" },
    }
  ],
});

// ✅ Teacher competition schema (same as student competitions)
const teacherCompetitionSchema = new mongoose.Schema({
  competition: { type: String, required: true },
  title: { type: String, required: true },
  participants: [
    {
      member_id: { type: String, required: true },
      member_name: { type: String, required: true },
      prize: { type: String, trim: true, default: "" },
    },
  ],
});


// ✅ Inner classEvent schema
const classEventSchema = new mongoose.Schema({
  className: { type: String, required: true },
  competitions: [competitionSchema],
});

// ✅ Event By schema (merged here)
const endeavourEventBySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

// ✅ Main Event schema
const endeavourEventSchema = new mongoose.Schema({
  eventBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EndeavourEventBy",
    required: true
  },
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  registerBefore: { type: Date, required: true },
  venue: { type: String, required: true },
  description: { type: String, required: true },
  studentCompetitions: [{ type: String }],
  teacherCompetitions: [{ type: String }],
  classEvents: [classEventSchema],
  teacherCompEvents: [teacherCompetitionSchema],
}, { timestamps: true });

// ✅ Register both models
const EndeavourEvent = mongoose.model("EndeavourEvent", endeavourEventSchema);
const EndeavourEventBy = mongoose.model("EndeavourEventBy", endeavourEventBySchema);

module.exports = { EndeavourEvent, EndeavourEventBy };
