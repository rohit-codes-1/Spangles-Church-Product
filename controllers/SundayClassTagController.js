const SundayClassTag = require("../Schema/SundayClassTag");

// ➤ Get all Sunday class tags
exports.getSundayClassTags = async (req, res) => {
  try {
    const tags = await SundayClassTag.find().sort({ name: 1 });
    res.json({ classTags: tags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ Update Sunday class tags (add or overwrite)
exports.updateSundayClassTags = async (req, res) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names)) {
      return res.status(400).json({ message: "Names must be an array" });
    }

    // Clear and reinsert
    await SundayClassTag.deleteMany({});
    const newTags = await SundayClassTag.insertMany(
      names.map((n) => ({ name: n.trim() }))
    );

    res.json({ classTags: newTags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
