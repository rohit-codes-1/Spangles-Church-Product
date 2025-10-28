const mongoose = require("mongoose");

const MonthlyContributionSchema = new mongoose.Schema({
  date: { type: Date, required: true }, // actual entry date
  monthlySubscriptionOffering: { type: Number, default: 0 },
  buildingFund: { type: Number, default: 0 },
  missionarySponsorship: { type: Number, default: 0 },
  decimalPart: { type: Number, default: 0 },
  ims: { type: Number, default: 0 },
  fmpb: { type: Number, default: 0 },
  nms: { type: Number, default: 0 },
  iem: { type: Number, default: 0 },
  vishwavani: { type: Number, default: 0 },
  bym: { type: Number, default: 0 },
  dbm: { type: Number, default: 0 },
  cgmm: { type: Number, default: 0 },
  cmm: { type: Number, default: 0 },
  ymm: { type: Number, default: 0 },
  bibleSociety: { type: Number, default: 0 },
  womensMinistry: { type: Number, default: 0 },
  educationalAssistance: { type: Number, default: 0 },
  helpThePoor: { type: Number, default: 0 },
  medicalAssistance: { type: Number, default: 0 },
  harvestAuction: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const SubscriptionSchema = new mongoose.Schema(
  {
    member_id: { type: String, required: true },
    member_name: { type: String, required: true },
    year: { type: Number, required: true }, // financial year start (e.g. 2025 = Apr 2025–Mar 2026)

    // Months Apr → Mar
    april: MonthlyContributionSchema,
    may: MonthlyContributionSchema,
    june: MonthlyContributionSchema,
    july: MonthlyContributionSchema,
    august: MonthlyContributionSchema,
    september: MonthlyContributionSchema,
    october: MonthlyContributionSchema,
    november: MonthlyContributionSchema,
    december: MonthlyContributionSchema,
    january: MonthlyContributionSchema,
    february: MonthlyContributionSchema,
    march: MonthlyContributionSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);
