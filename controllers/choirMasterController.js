const ChoirMaster = require("../Schema/ChoirMasterSchema");

// Add Choir Master
exports.addChoirMaster = async (req, res) => {
  try {
    const data = req.body;

    if (data.isMember) {
      // ✅ Validation for members
      if (!data.memberId || !data.memberName || !data.phone) {
        return res.status(400).json({ message: "Member details are incomplete" });
      }
    } else {
      // ✅ Validation for non-members
      if (!data.nonMemberName || !data.nonMemberPhone) {
        return res.status(400).json({ message: "Non-member details are incomplete" });
      }
    }

    // Force status to Active by default
    const choirMaster = new ChoirMaster({
      ...data,
      status: "Active",
      inactiveDate: null,
      inactiveReason: null,
    });

    await choirMaster.save();

    res.status(201).json({ message: "Choir Master added successfully", choirMaster });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get Choir Masters (with pagination + search)
exports.getChoirMasters = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "All" } = req.query;

    let query = search
      ? {
          $or: [
            { memberName: { $regex: search, $options: "i" } },
            { nonMemberName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    if (status !== "All") {
      query.status = status;
    }

    const choirMasters = await ChoirMaster.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ChoirMaster.countDocuments(query);

    res.status(200).json({
      data: choirMasters,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// Update Choir Master Status (Active -> Inactive only)
exports.updateChoirMasterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, inactiveReason } = req.body;

    const choirMaster = await ChoirMaster.findById(id);
    if (!choirMaster) {
      return res.status(404).json({ message: "Choir Master not found" });
    }

    // Prevent reactivation
    if (choirMaster.status === "Inactive") {
      return res.status(400).json({ message: "Cannot reactivate once inactive" });
    }

    if (status === "Inactive") {
      choirMaster.status = "Inactive";
      choirMaster.inactiveDate = new Date();
      choirMaster.inactiveReason = inactiveReason || "";
    }

    await choirMaster.save();
    res.status(200).json({ message: "Status updated successfully", choirMaster });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
