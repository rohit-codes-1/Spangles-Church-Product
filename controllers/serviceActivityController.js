const ServiceActivity = require("../Schema/ServiceActivitySchema"); 

// 👉 Create activity
exports.createActivity = async (req, res) => {
  try {
    const { type, date, day, heading, points } = req.body;

    if (!type || !date || !day) {
      return res.status(400).json({ message: "Type, date, and day are required" });
    }

    const newActivity = new ServiceActivity({
      type,
      date,
      day,
      heading,
      points
    });

    await newActivity.save();
    res.status(201).json(newActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👉 Get activities (with filters + pagination)
exports.getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, from, to, search, type } = req.query;

    const filter = {};

    // Date range filter
    if (from && to) {
      filter.date = { $gte: new Date(from), $lte: new Date(to) };
    } else if (from) {
      filter.date = { $gte: new Date(from) };
    } else if (to) {
      filter.date = { $lte: new Date(to) };
    }

    // Type filter (service / notification)
    if (type) {
      filter.type = type;
    }

    // Search filter (on heading or points.title/notes)
    if (search) {
      filter.$or = [
        { heading: { $regex: search, $options: "i" } },
        { "points.title": { $regex: search, $options: "i" } },
        { "points.notes": { $regex: search, $options: "i" } }
      ];
    }

    // Fetch with filters + pagination
    const activities = await ServiceActivity.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ServiceActivity.countDocuments(filter);

    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 👉 Get single activity
exports.getActivityById = async (req, res) => {
  try {
    const activity = await ServiceActivity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👉 Update activity
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ServiceActivity.findByIdAndUpdate(id, req.body, {
      new: true
    });
    if (!updated) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👉 Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ServiceActivity.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
