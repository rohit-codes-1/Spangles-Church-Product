const SundayClass = require("../Schema/SundayClass");
const Member = require("../Schema/memberSchema"); // you already have this

// Create new class
exports.createClass = async (req, res) => {
  try {
    const { teacherId, ...rest } = req.body;

    const teacher = await Member.findOne({ member_id: teacherId });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const newClass = new SundayClass({
      ...rest,
      teacher: {
        member_id: teacher.member_id,
        name: teacher.member_name,
        tamil_name: teacher.member_tamil_name,
      },
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get all classes
// Get classes with filters & pagination
exports.getClasses = async (req, res) => {
  try {
    const {
      search = "",           // text search over class/section/teacher
      from = "",             // ISO date
      to = "",               // ISO date
      page = 1,
      limit = 10,
    } = req.query;

    const q = {};

    // text search across class_name, section_name, teacher fields
    if (search) {
      q.$or = [
        { class_name:   { $regex: search, $options: "i" } },
        { section_name: { $regex: search, $options: "i" } },
        { "teacher.name":        { $regex: search, $options: "i" } },
        { "teacher.member_id":   { $regex: search, $options: "i" } },
      ];
    }

    // date range (overlap) on year_from/year_to
    if (from || to) {
      const fromDate = from ? new Date(from) : new Date("1900-01-01");
      const toDate   = to   ? new Date(to)   : new Date("2999-12-31");
      // overlap condition: not (class ends before from OR starts after to)
      q.$and = [
        { year_to:   { $gte: fromDate } },
        { year_from: { $lte: toDate } },
      ];
    }

    const pageNum  = Math.max(parseInt(page, 10) || 1, 1);
    const perPage  = Math.max(parseInt(limit, 10) || 10, 1);
    const skip     = (pageNum - 1) * perPage;

    const [items, totalCount] = await Promise.all([
      SundayClass.find(q).sort({ createdAt: -1 }).skip(skip).limit(perPage),
      SundayClass.countDocuments(q)
    ]);

    res.json({
      classes: items,
      page: pageNum,
      totalPages: Math.ceil(totalCount / perPage),
      totalCount
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: error.message });
  }
};


// Delete class
exports.deleteClass = async (req, res) => {
  try {
    await SundayClass.findByIdAndDelete(req.params.id);
    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers with their classes
exports.getTeachersWithClasses = async (req, res) => {
  try {
    const classes = await SundayClass.find();
    const teachers = classes.map(c => ({
      class_name: c.class_name,
      section_name: c.section_name,
      teacher: c.teacher,
    }));
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers with their classes and phone numbers
// exports.getTeachersWithDetails = async (req, res) => {
//   try {
//     const classes = await SundayClass.find();

//     // For each class, fetch teacher details from Member collection
//     const results = await Promise.all(
//       classes.map(async (c) => {
//         if (!c.teacher?.member_id) return null;

//         const teacherMember = await Member.findOne(
//           { member_id: c.teacher.member_id },
//           "member_id member_name member_tamil_name mobile_number"
//         );

//         return {
//           teacher_id: teacherMember?.member_id,
//           teacher_name: teacherMember?.member_name,
//           teacher_tamil_name: teacherMember?.member_tamil_name,
//           mobile_number: teacherMember?.mobile_number,
//           class_name: c.class_name,
//           section_name: c.section_name,
//           class_id: c._id, // needed for edit
//         };
//       })
//     );

//     res.json(results.filter(Boolean)); // remove nulls
//   } catch (error) {
//     console.error("Error fetching teacher details:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
exports.getTeachersWithDetails = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Fetch classes (for teacher linkage)
    const classes = await SundayClass.find();

    // Map teacher details
    const results = await Promise.all(
      classes.map(async (c) => {
        if (!c.teacher?.member_id) return null;

        const teacherMember = await Member.findOne(
          { member_id: c.teacher.member_id },
          "member_id member_name member_tamil_name mobile_number"
        );

        return {
          teacher_id: teacherMember?.member_id,
          teacher_name: teacherMember?.member_name,
          teacher_tamil_name: teacherMember?.member_tamil_name,
          mobile_number: teacherMember?.mobile_number,
          class_name: c.class_name,
          section_name: c.section_name,
          class_id: c._id,
        };
      })
    );

    // Clean nulls
    let teachers = results.filter(Boolean);

    // ✅ Apply search
    if (search) {
      const regex = new RegExp(search, "i");
      teachers = teachers.filter(
        (t) =>
          regex.test(t.teacher_name) ||
          regex.test(t.teacher_tamil_name) ||
          regex.test(t.teacher_id) ||
          regex.test(t.mobile_number) ||
          regex.test(t.class_name) ||
          regex.test(t.section_name)
      );
    }

    // ✅ Pagination
    const total = teachers.length;
    const startIndex = (page - 1) * limit;
    const paginated = teachers.slice(startIndex, startIndex + limit);

    res.json({
      teachers: paginated,
      totalPages: Math.ceil(total / limit),
      total,
      page,
    });
  } catch (error) {
    console.error("Error fetching teacher details:", error);
    res.status(500).json({ message: error.message });
  }
};



// Update Sunday Class
exports.updateSundayClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, ...rest } = req.body;

    let teacherData = null;

    if (teacherId) {
      // fetch teacher details from Members
      const teacher = await Member.findOne({ member_id: teacherId });
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      teacherData = {
        member_id: teacher.member_id,
        name: teacher.member_name,
        tamil_name: teacher.member_tamil_name,
      };
    }

    const updatedClass = await SundayClass.findByIdAndUpdate(
      id,
      {
        ...rest,
        ...(teacherData ? { teacher: teacherData } : {}), // only update if teacherId provided
      },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(updatedClass);
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// sundayClassController.js
// exports.getEligibleStudents = async (req, res) => {
//   try {
//     const classData = await SundayClass.findById(req.params.classId);
//     if (!classData) {
//       return res.status(404).json({ message: "Class not found" });
//     }

//     const eligible = await Member.find({
//       date_of_birth: { $gte: classData.year_from, $lte: classData.year_to }
//     }).select("member_id member_name member_tamil_name date_of_birth parent_name address");

//     // Mark which are already enrolled
//     const enrolledIds = classData.students.map(s => s.member_id);

//     const result = eligible.map(m => ({
//       ...m.toObject(),
//       alreadyEnrolled: enrolledIds.includes(m.member_id)  // ✅ mark them
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error("Error fetching eligible students:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

exports.getEligibleStudents = async (req, res) => {
  try {
    const classData = await SundayClass.findById(req.params.classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // 1️⃣ Find all classes with the same class_name
    const sameClassNameClasses = await SundayClass.find(
      { class_name: classData.class_name },
      "students.member_id"
    );

    // 2️⃣ Collect all student IDs already enrolled in any section of this class_name
    const alreadyEnrolledIds = sameClassNameClasses.flatMap((c) =>
      c.students.map((s) => s.member_id)
    );

    // 3️⃣ Fetch eligible students by DOB/year range, excluding already enrolled
    const eligible = await Member.find({
      date_of_birth: { $gte: classData.year_from, $lte: classData.year_to },
      member_id: { $nin: alreadyEnrolledIds }, // ❌ Exclude students already enrolled
    }).select(
      "member_id member_name member_tamil_name date_of_birth parent_name address"
    );

    res.json(eligible); // only students who can actually enroll
  } catch (err) {
    console.error("Error fetching eligible students:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.addStudentsToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { students } = req.body; // full final list from frontend

    const classData = await SundayClass.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // overwrite students with the new selection
    classData.students = students;
    await classData.save();

    res.json({ message: "Students updated successfully", class: classData });
  } catch (err) {
    console.error("Error updating students:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.getClassWithStudents = async (req, res) => {
  try {
    const classData = await SundayClass.findById(req.params.classId);
    if (!classData) return res.status(404).json({ message: "Class not found" });
    res.json(classData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 


// ➤ Get all students for classes taught by a teacher
exports.getStudentsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Find all classes taught by this teacher
    const classes = await SundayClass.find({ "teacher.member_id": teacherId });

    // Collect all students with class info
    const students = classes.flatMap((cls) =>
      (cls.students || []).map((s) => ({ 
        ...s.toObject(), 
        class_id: cls._id, 
        class_name: cls.class_name, 
        section_name: cls.section_name,
      }))
    );

    res.json({ students });
  } catch (err) {
    console.error("Error fetching teacher's students:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getEventClassGroups = async (req, res) => {
  try {
    const classes = await SundayClass.find().select("class_name");

    // Extract unique base names before hyphen (like "Primary", "Junior")
    const classGroups = [...new Set(
      classes.map(c => c.class_name.split("-")[0].trim())
    )];

    res.json(classGroups);
  } catch (err) {
    console.error("Error fetching event class groups:", err);
    res.status(500).json({ message: "Failed to fetch class groups" });
  }
};