const SundaySchoolPrize = require("../Schema/SundaySchoolPrize");

exports.addPrizes = async (req, res) => {
  try {
    const { prizes } = req.body;
    if (!prizes?.length) 
      return res.status(400).json({ message: "No prizes provided" });

    let existing = await SundaySchoolPrize.findOne();
    if (existing) {
      existing.prizes = prizes;
      await existing.save();
    } else {
      await SundaySchoolPrize.create({ prizes });
    }

    res.json({ status: "Success", message: "Prizes saved successfully!" });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};

exports.getPrizes = async (req, res) => {
  try {
    const prizes = await SundaySchoolPrize.findOne();
    res.json({ status: "Success", prizes: prizes?.prizes || [] });
  } catch (err) {
    res.status(500).json({ status: "Failed", message: err.message });
  }
};
