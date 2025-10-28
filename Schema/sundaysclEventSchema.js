const mongoose = require("mongoose");

// ✅ Inner competition schema
const ssCompetitionSchema = new mongoose.Schema({
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
const ssTeacherCompetitionSchema = new mongoose.Schema({
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
const ssClassEventSchema = new mongoose.Schema({
  className: { type: String, required: true },
  competitions: [ssCompetitionSchema],
});

// ✅ Event By schema (merged here)
const sundaySchoolEventBySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

// ✅ Main Event schema
const sundaySchoolEventSchema = new mongoose.Schema({
  eventBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SundaySchoolEventBy",
    required: true
  },
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  registerBefore: { type: Date, required: true },
  venue: { type: String, required: true },
  description: { type: String, required: true },
  studentCompetitions: [{ type: String }],
  teacherCompetitions: [{ type: String }],
  classEvents: [ssClassEventSchema],
  teacherCompEvents: [ssTeacherCompetitionSchema],
}, { timestamps: true });

// ✅ Register both models
const SundaySchoolEvent = mongoose.model("SundaySchoolEvent", sundaySchoolEventSchema);
const SundaySchoolEventBy = mongoose.model("SundaySchoolEventBy", sundaySchoolEventBySchema);

module.exports = { SundaySchoolEvent, SundaySchoolEventBy };
