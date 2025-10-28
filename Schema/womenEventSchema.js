const mongoose = require("mongoose");

const womenCompetitionSchema = new mongoose.Schema({
  competition: { type: String, required: true },
  title: { type: String, required: true },
  participants: [
    {
      member_id: { type: String },
      member_name: { type: String },
      member_tamil_name: { type: String },
      prize: { type: String, trim: true, default: "" },
    },
  ],
});

const womenEventBySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

const womenEventSchema = new mongoose.Schema({
  eventBy: { type: mongoose.Schema.Types.ObjectId, ref: "WomenEventBy", required: true },
  eventName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  registerBefore: { type: Date, required: true },
  venue: { type: String, required: true },
  description: { type: String, required: true },
  womenCompetitions: [womenCompetitionSchema], // only main competitions
}, { timestamps: true });

const WomenEvent = mongoose.model("WomenEvent", womenEventSchema);
const WomenEventBy = mongoose.model("WomenEventBy", womenEventBySchema);

module.exports = { WomenEvent, WomenEventBy };
