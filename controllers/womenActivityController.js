const WomenActivity = require("../Schema/WomenActivitySchema");

// ✅ Create Activity
exports.createActivity = async (req, res) => {
  try {
    const activity = new WomenActivity(req.body);
    await activity.save();
    res.status(201).json({ status: "Success", message: "Activity Created", activity });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};

// ✅ Get Activities with filters + pagination
exports.getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { startDate, endDate, search, status } = req.query;

    const filter = {};

    // Date filter
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Status filter
    if (status && status !== "All") {
      filter.status = status;
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { activityType: regex },
        { title: regex },
        { churchName: regex },
        { customTitle: regex },
        { "leader.name": regex },
        { "houses.name": regex },
      ];
    }

    const [activities, total] = await Promise.all([
      WomenActivity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WomenActivity.countDocuments(filter),
    ]);

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};

// ✅ Mark Attendance
exports.markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendees } = req.body;

    const activity = await WomenActivity.findById(id);
    if (!activity) return res.status(404).json({ status: "Failed", message: "Activity not found" });

    if (activity.status === "Completed") {
      return res.status(400).json({ status: "Failed", message: "Cannot modify attendance of a completed activity" });
    }

    activity.attendees = attendees;
    await activity.save();
    res.json({ status: "Success", message: "Attendance Updated", activity });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};

// ✅ Attendance Summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await WomenActivity.findById(id);

    if (!activity) return res.status(404).json({ message: "Activity not found" });

    const totalPresent = activity.attendees.filter(a => a.status === "present").length;
    const membersPresent = activity.attendees.filter(a => a.status === "present" && a.isMember).length;
    const guestsPresent = activity.attendees.filter(a => a.status === "present" && !a.isMember).length;
    const totalMembers = activity.attendees.filter(a => a.isMember).length;

    res.json({ totalPresent, membersPresent, guestsPresent, totalMembers });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};

// ✅ Update Activity
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await WomenActivity.findById(id);
    if (!activity) return res.status(404).json({ status: "Failed", message: "Activity not found" });

    if (activity.status === "Completed") {
      return res.status(400).json({ status: "Failed", message: "Completed activity cannot be modified" });
    }

    if (req.body.totalOffering !== undefined) {
      req.body.totalOffering = Number(req.body.totalOffering) || 0;
    }
    if (Array.isArray(req.body.houses)) {
      req.body.houses = req.body.houses.map(h => ({
        ...h,
        offering: Number(h.offering) || 0
      }));
    }

    const updatedActivity = await WomenActivity.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ status: "Success", message: "Activity Updated", activity: updatedActivity });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};
