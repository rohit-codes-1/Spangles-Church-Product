const MarriageHall = require("../Schema/MarriageHall.js");
const MarriageHallCategory = require("../Schema/MarriageHallCategory.js");

// ➤ Save a new hall
exports.createHall = async (req, res) => {
  try {
    const hall = new MarriageHall(req.body);
    await hall.save();
    return res.json({ status: "Success", message: "Hall added successfully" });
  } catch (err) {
    return res.status(400).json({ status: "Failed", message: err.message });
  }
};

// ➤ Fetch halls with search + pagination
exports.getHalls = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = search
      ? {
          $or: [
            { hall_name: { $regex: search, $options: "i" } },
            { reg_no: { $regex: search, $options: "i" } },
            { incharge_name: { $regex: search, $options: "i" } },
            { incharge_id: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const halls = await MarriageHall.find(query)
        .populate("categoryPrices.category", "name") 
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await MarriageHall.countDocuments(query);

    return res.json({
      status: "Success",
      message: "Marriage halls fetched",
      data: halls,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res.status(500).json({ status: "Failed", message: err.message });
  }
};

// ➤ Update a hall
exports.updateMarriageHall = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedHall = await MarriageHall.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true, // ✅ keep schema validation
    });

    if (!updatedHall) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Hall not found" });
    }

    return res.json({
      status: "Success",
      message: "Hall updated successfully",
      data: updatedHall,
    });
  } catch (err) {
    return res.status(500).json({
      status: "Failed",
      message: "Error updating hall",
      error: err.message,
    });
  }
};




exports.updateCategoryPrices = async (req, res) => {
  try {
    const hallId = req.params.id;
    const { categoryPrices } = req.body; 
    // categoryPrices = [{ category: ObjectId, price: Number }, ...]

    if (!Array.isArray(categoryPrices) || categoryPrices.length === 0) {
      return res.status(400).json({ message: "categoryPrices must be a non-empty array" });
    }

    // Fetch the hall
    const hall = await MarriageHall.findById(hallId);
    if (!hall) return res.status(404).json({ message: "Hall not found" });

    // Merge/update prices
    categoryPrices.forEach((newPrice) => {
      const existing = hall.categoryPrices.find(
        (cp) => cp.category.toString() === newPrice.category
      );
      if (existing) {
        existing.price = newPrice.price; // update existing
      } else {
        hall.categoryPrices.push(newPrice); // add new
      }
    });

    await hall.save();

    res.json({ message: "Category prices updated successfully!", data: hall.categoryPrices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


// DELETE /marriage-halls/:hallId/delete-category/:categoryId
exports.deleteCategoryPrice = async (req, res) => {
    try {
        const { hallId, categoryId } = req.params;

        const hall = await MarriageHall.findById(hallId);
        if (!hall) return res.status(404).json({ message: "Hall not found" });

        hall.categoryPrices = hall.categoryPrices.filter(
            cp => cp.category.toString() !== categoryId
        );

        await hall.save();

        res.json({ message: "Category price deleted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
