const RegularExpense = require("../Schema/RegularExpense");

// Add Expense
exports.addExpense = async (req, res) => {
  try {
    const expense = new RegularExpense(req.body);
    await expense.save();
    res.status(201).json({ status: "Success", message: "Expense added successfully", data: expense });
  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};

// Get all Expenses
exports.getExpenses = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status, type } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Base filter
    let filter = {};

    // Search filter
    if (search) {
      filter.expensename = { $regex: search, $options: "i" };
    }

    // Status filter
    if (status) {
      filter.status = status; // e.g., active / inactive
    }

    // Type filter
    if (type) {
      filter.type_of_expense = type; // e.g., regular_expense / irregular_expense
    }

    // Count total
    const totalCount = await RegularExpense.countDocuments(filter);

    // Fetch with pagination
    const expenses = await RegularExpense.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      status: "Success",
      data: expenses,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};


exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params; // expense id
    const updatedExpense = await RegularExpense.findByIdAndUpdate(
      id,
      req.body, // can update status, desc, amount etc.
      { new: true } // return updated document
    );

    if (!updatedExpense) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Expense not found" });
    }

    res.status(200).json({
      status: "Success",
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    res.status(500).json({ status: "Failed", message: error.message });
  }
};

// Get only Active Regular Expenses (for dropdowns)
exports.getActiveRegularExpenses = async (req, res) => {
  try {
    const expenses = await RegularExpense.find({
      status: "active",
      type_of_expense: "regular_expense",
    }).sort({ expensename: 1 }); // sorted alphabetically

    res.status(200).json({
      status: "Success",
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      status: "Failed",
      message: error.message,
    });
  }
};
