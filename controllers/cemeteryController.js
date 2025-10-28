const Cemetery = require("../Schema/cemeterySchema");

// cemeteryController.js

// ➕ Add Cemetery
exports.addCemetery = async (req, res) => {
  try {
    // ✅ ADD number_of_available_slots to destructuring
    const { cemetery_name, location, manager, slots, number_of_available_slots } = req.body; 

    if (!cemetery_name || !location || !manager) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // ✅ ADD number_of_available_slots to the constructor
    const cemetery = new Cemetery({ 
        cemetery_name, 
        location, 
        manager, 
        slots,
        number_of_available_slots // <-- Include the calculated value here
    });
    await cemetery.save();

    res.status(201).json({ message: "Cemetery created successfully", cemetery });
  } catch (error) {
    res.status(500).json({ message: "Server error while creating cemetery", error: error.message });
  }
};

// 📃 Get Cemeteries (with pagination + search)
exports.getCemeteries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = search
      ? { cemetery_name: { $regex: search, $options: "i" } }
      : {};

    const cemeteries = await Cemetery.find(query)
      .populate("manager", "member_name email") // only needed fields
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Cemetery.countDocuments(query);

    res.status(200).json({
      cemeteries,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching cemeteries", error: error.message });
  }
};

// 👀 Get Single Cemetery
exports.getCemeteryById = async (req, res) => {
  try {
    const cemetery = await Cemetery.findById(req.params.id).populate("manager", "member_name email");
    if (!cemetery) {
      return res.status(404).json({ message: "Cemetery not found" });
    }
    res.status(200).json(cemetery);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching cemetery", error: error.message });
  }
};

// ✏️ Update Cemetery
exports.updateCemetery = async (req, res) => {
  try {
    const cemetery = await Cemetery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cemetery) {
      return res.status(404).json({ message: "Cemetery not found" });
    }
    res.status(200).json({ message: "Cemetery updated successfully", cemetery });
  } catch (error) {
    res.status(500).json({ message: "Server error while updating cemetery", error: error.message });
  }
};

// ❌ Delete Cemetery
exports.deleteCemetery = async (req, res) => {
  try {
    const cemetery = await Cemetery.findByIdAndDelete(req.params.id);
    if (!cemetery) {
      return res.status(404).json({ message: "Cemetery not found" });
    }
    res.status(200).json({ message: "Cemetery deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error while deleting cemetery", error: error.message });
  }
};
