const EndeavourClassTag = require("../Schema/EndeavourClassTag");

// ➤ Get all class tags
exports.getClassTags = async (req, res) => {
  try {
    const tags = await EndeavourClassTag.find().sort({ name: 1 });
    res.json({ classTags: tags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ Update class tags (add or overwrite)
exports.updateClassTags = async (req, res) => {
  try {
    const { names } = req.body;
    if (!Array.isArray(names)) {
      return res.status(400).json({ message: "Names must be an array" });
    }

    // Clear and reinsert
    await EndeavourClassTag.deleteMany({});
    const newTags = await EndeavourClassTag.insertMany(
      names.map((n) => ({ name: n.trim() }))
    );

    res.json({ classTags: newTags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
