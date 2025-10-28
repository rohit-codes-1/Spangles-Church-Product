const YouthFellowship = require("../Schema/YouthFellowshipSchema");
const Member = require("../Schema/memberSchema");

// ➤ Add Youth Member
exports.addYouthMember = async (req, res) => {
  try {
    const { member_id } = req.body;

    if (!member_id) {
      return res.status(400).json({ message: "Member ID is required" });
    }

    // 🔎 Lookup member from main Member schema
    const member = await Member.findOne({ member_id });
    if (!member) {
      return res.status(404).json({ message: "Member not found in main records" });
    }

    // Save into youth fellowship with all needed fields
    const youth = new YouthFellowship({
      member_id: member.member_id,
      member_name: member.member_name,
      member_tamil_name: member.member_tamil_name, // ✅ auto-fetch Tamil name
      mobile_number: member.mobile_number,
    });

    await youth.save();
    res.status(201).json(youth);
  } catch (err) {
    console.error("❌ Error adding youth member:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ➤ Get youth members (with pagination)
exports.getYouthMembers = async (req, res) => {
  try {
    let { page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const skip = (page - 1) * limit;

    const total = await YouthFellowship.countDocuments();
    const members = await YouthFellowship.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: members,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
    });
  } catch (err) {
    console.error("❌ Error fetching youth members:", err);
    res.status(500).json({ message: "Server error" });
  }
};