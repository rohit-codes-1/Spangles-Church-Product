const Attendance = require("../Schema/Attendance");
const SundayClass = require("../Schema/SundayClass");
 
// ➤ Add new attendance
// ➤ Add new attendance
// exports.addAttendance = async (req, res) => {
//   try {
//     const { class: classId, date, attendance, offering } = req.body;

//     if (!classId || !date || !attendance) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // if attendance is already array, just use it
//     const attendanceArray = Array.isArray(attendance)
//       ? attendance
//       : Object.keys(attendance).map((member_id) => ({
//           member_id,
//           present: attendance[member_id],
//         }));

//     const newRecord = new Attendance({
//       class: classId, 
//       date,
//       attendance: attendanceArray,
//       offering,
//     });

//     await newRecord.save();
//     res.status(201).json(newRecord);
//   } catch (err) {
//     console.error("❌ Error adding attendance:", err);
//     if (err.code === 11000) {
//       return res.status(400).json({ message: "Attendance already exists for this date" });
//     }
//     res.status(500).json({ message: "Server error" });
//   }
// };


// // ➤ Update existing attendance
// exports.updateAttendance = async (req, res) => {
//   try {
//     const { id } = req.params; // classId
//     const { date, attendance, offering } = req.body;

//     const attendanceArray = Array.isArray(attendance)
//   ? attendance
//   : Object.keys(attendance).map((member_id) => ({
//       member_id,
//       present: attendance[member_id],
//     }));

//     const updated = await Attendance.findOneAndUpdate(
//   { class: id, date },
//   { attendance: attendanceArray, offering },
//   { new: true }
// );

//     if (!updated) {
//       return res.status(404).json({ message: "Attendance not found" });
//     }

//     res.json(updated);
//   } catch (err) {
//     console.error("❌ Error updating attendance:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ➤ Get attendance report
// exports.getAttendance = async (req, res) => {
//   try {
//     const { classId, date } = req.query;

//     const query = {};
//     if (classId) query.class = classId;
//     if (date) query.date = date;

//     const records = await Attendance.find(query).populate("class", "class_name section_name teacher");
//     res.json(records);
//   } catch (err) {
//     console.error("❌ Error fetching attendance:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };




exports.addAttendance = async (req, res) => {
  try {
    const { class: classId, date, attendance, offering } = req.body;

    if (!classId || !date || !attendance) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const attendanceArray = Array.isArray(attendance)
      ? attendance
      : Object.keys(attendance).map((member_id) => ({
          member_id,
          present: attendance[member_id],
        }));

    const newRecord = new Attendance({
      class: classId,
      date,
      attendance: attendanceArray,
      offering,
    });

    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Attendance already exists for this date" });
    }
    console.error("Error adding Endeavour attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update attendance
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, attendance, offering } = req.body;

    const attendanceArray = Array.isArray(attendance)
      ? attendance
      : Object.keys(attendance).map((member_id) => ({
          member_id,
          present: attendance[member_id],
        }));

    const updated = await Attendance.findOneAndUpdate(
      { class: id, date },
      { attendance: attendanceArray, offering },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Attendance not found" });

    res.json(updated);
  } catch (err) {
    console.error("Error updating Endeavour attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};
 
// Get attendance
exports.getAttendance = async (req, res) => {
  try {
    const { classId, date } = req.query;
    const query = {};
    if (classId) query.class = classId;
    if (date) query.date = date;

    const records = await Attendance.find(query).populate(
      "class",
      "class_name section_name teacher"
    );
    res.json(records);
  } catch (err) {
    console.error("Error fetching Endeavour attendance:", err);
    res.status(500).json({ message: "Server error" });
  }
};
 
