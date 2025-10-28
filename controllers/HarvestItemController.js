// Controllers/HarvestItemController.js
const HarvestItem = require("../Schema/HarvestItem");

// ➤ Add Harvest Item
exports.addHarvestItem = async (req, res) => {
  try {
    const item = new HarvestItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Get All Items (with pagination)
exports.getHarvestItems = async (req, res) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const skip = (page - 1) * limit;

    const items = await HarvestItem.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HarvestItem.countDocuments();

    res.status(200).json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Update Harvest Item
exports.updateHarvestItem = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedItem = await HarvestItem.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true } // return updated doc & validate schema
    );

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};