const MarriageHallCategory = require("../Schema/MarriageHallCategory");

// ➤ Create a new global category
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ status: "Failed", message: "Category name is required" });
    }

    // Check if exists
    const existing = await MarriageHallCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ status: "Failed", message: "Category already exists" });
    }

    const category = new MarriageHallCategory({ name });
    await category.save();

    return res.json({ status: "Success", message: "Category created successfully", data: category });
  } catch (err) {
    return res.status(500).json({ status: "Failed", message: err.message });
  }
};


exports.getCategories = async (req, res) => {
  try {
    const categories = await MarriageHallCategory.find().sort({ createdAt: -1 });
    res.json({ status: "Success", data: categories });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};