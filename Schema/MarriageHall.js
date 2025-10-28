const mongoose = require("mongoose");

const marriageHallSchema = new mongoose.Schema(
  {
    reg_no: { type: String, required: true, unique: true },
    hall_name: { type: String, required: true },
    address: { type: String },
    incharge_id: { type: String, required: true },   // link to member_id
    incharge_name: { type: String, required: true }, // duplicate for quick search
    incharge_phone: { type: String },
    facilities: [{ type: String }],
    hall_capacity: { type: Number },
    dining_capacity: { type: Number },
    categoryPrices: [
      {
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MarriageHallCategory", // reference global category
          required: true,
        },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);


module.exports = mongoose.model("MarriageHall", marriageHallSchema);