const MenFellowship = require("../Schema/MenFellowship");

// ➕ Add new member to Men's Fellowship
exports.addMenFellowshipMember = async (req, res) => {
  try {
    const { member_id, member_name, member_tamil_name, mobile_number } = req.body;

    if (!member_id || !member_name) {
      return res.status(400).json({ message: "Member ID and Name are required" });
    }

    // Prevent duplicate entry
    const exists = await MenFellowship.findOne({ member_id });
    if (exists) {
      return res.status(400).json({ message: "This member is already in Men's Fellowship" });
    }

    const newMember = new MenFellowship({
      member_id,
      member_name,
      member_tamil_name,
      mobile_number,
    });

    await newMember.save();
    res.status(201).json({ message: "Member added successfully", member: newMember });
  } catch (err) {
    console.error("❌ Error adding Men’s Fellowship member:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📋 Get all Men’s Fellowship members
exports.getMenFellowshipMembers = async (req, res) => {
  try {
    const members = await MenFellowship.find().sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
