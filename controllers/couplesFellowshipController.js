const CouplesFellowship = require("../Schema/CouplesFellowshipSchema");
const Member = require("../Schema/memberSchema");

exports.addCoupleMember = async (req, res) => {
  try {
    const { husband, wife } = req.body;

    // Validate
    if (!husband?.member_id || !husband?.member_name) {
      return res.status(400).json({ message: "Husband Member ID and name are required" });
    }
    if (!wife?.member_id || !wife?.member_name) {
      return res.status(400).json({ message: "Wife Member ID and name are required" });
    }

    // Save to DB
    const couple = new CouplesFellowship({
      husband,
      wife,
    });

    await couple.save();
    res.status(201).json(couple);
  } catch (err) {
    console.error("❌ Error adding couple member:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ➤ Get all Couples Fellowship members
// exports.getCoupleMembers = async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const skip = (page - 1) * limit;

//     const total = await CouplesFellowship.countDocuments();
//     const couples = await CouplesFellowship.find()
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     res.status(200).json({
//       data: couples,
//       totalPages: Math.ceil(total / limit),
//       currentPage: Number(page),
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };


exports.getCoupleMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const total = await CouplesFellowship.countDocuments();
    const couples = await CouplesFellowship.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // 🔎 Attach family_id of husband
    for (let couple of couples) {
      const husband = await Member.findOne({ member_id: couple.husband.member_id }).lean();
      if (husband?.family_id) {
        couple.husband.family_id = husband.family_id;
      }
    }

    res.status(200).json({
      data: couples,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
