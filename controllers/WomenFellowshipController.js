const WomenFellowship = require("../Schema/WomenFellowship");

// ➕ Add new member to Women's Fellowship
exports.addWomenFellowshipMember = async (req, res) => {
  try {
    const { member_id, member_name, member_tamil_name, mobile_number } = req.body;

    if (!member_id || !member_name) {
      return res.status(400).json({ message: "Member ID and Name are required" });
    }

    // Prevent duplicate entry
    const exists = await WomenFellowship.findOne({ member_id });
    if (exists) {
      return res.status(400).json({ message: "This member is already in Women's Fellowship" });
    }

    const newMember = new WomenFellowship({
      member_id,
      member_name,
      member_tamil_name,
      mobile_number,
    });

    await newMember.save();
    res.status(201).json({ message: "Member added successfully", member: newMember });
  } catch (err) {
    console.error("❌ Error adding Women’s Fellowship member:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📋 Get all Women’s Fellowship members
exports.getWomenFellowshipMembers = async (req, res) => {
  try {
    const members = await WomenFellowship.find().sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
