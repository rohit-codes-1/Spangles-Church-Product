const ChoirMember = require("../Schema/ChoirMemberSchema");

// Add a new Choir Member
exports.addChoirMember = async (req, res) => {
  try {
    const { member_id, member_name, member_tamil_name, mobile_number } = req.body;

    if (!member_id || !member_name) {
      return res.status(400).json({ message: "Member ID and Name are required" });
    }

    // Check if member already exists
    const existingMember = await ChoirMember.findOne({ member_id });
    if (existingMember) {
      return res.status(400).json({ message: "Member already exists" });
    }

    const newMember = new ChoirMember({
      member_id,
      member_name,
      member_tamil_name,
      mobile_number,
    });

    await newMember.save();
    res.status(201).json({ message: "Choir member added successfully", member: newMember });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all Choir Members (with optional pagination)
exports.getChoirMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { member_name: { $regex: search, $options: "i" } }, // case-insensitive
          { member_id: { $regex: search, $options: "i" } }
        ]
      };
    }

    const total = await ChoirMember.countDocuments(query);
    const members = await ChoirMember.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    res.json({ members, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

