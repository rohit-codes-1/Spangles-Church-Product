const SundayExam = require("../Schema/sundayExamSchema");
const SundayExamBy = require("../Schema/SundayExamBySchema");
const SundaySchoolClass = require("../Schema/SundayClass");

// Create a new Sunday Exam
// exports.createSundayExam = async (req, res) => {
//   try {
//     const {
//       examName,
//       examDate,
//       registerBefore,
//       examcenter,
//       description,
//       examBy,
//       classExams,
//       teacherExam,
//     } = req.body;

//     const exam = new SundayExam({
//       examName,
//       examDate,
//       registerBefore,
//       examcenter,
//       description,
//       examBy,
//       classExams,
//       teacherExam,
//     });

//     await exam.save();
//     res.status(201).json({ success: true, exam });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Failed to create exam" });
//   }
// };

 // ✅ Create a new Sunday School Exam
exports.createSundayExam = async (req, res) => {
  try {
    let {
      examName,
      examDate,
      registerBefore,
      examcenter,
      description,
      examBy,
      classExams = [],
      teacherExam,
    } = req.body;

    // ✅ Validate required fields
    if (!examName || !examDate || !registerBefore || !examcenter || !examBy?.length) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // ✅ Clean up class exams: remove entries with missing className or portion
    classExams = classExams.filter(
      (cls) => cls.className && cls.portion?.trim()
    );

    // ✅ Expand grouped class names (like “Junior”, “Senior”) into all sections
    let expandedClassExams = [];
    for (const cls of classExams) {
      // Find all sections that match the base class name (before any " - " section part)
      const baseName = cls.className.split(" - ")[0].trim();
      const sections = await SundaySchoolClass.find({
        class_name: { $regex: `^${baseName}`, $options: "i" }, // case-insensitive
      });

      if (sections.length === 0) {
        // No matching sections found — keep original entry
        expandedClassExams.push(cls);
      } else {
        // Expand to all matching sections
        sections.forEach((sec) => {
          expandedClassExams.push({
            className: `${sec.class_name} - ${sec.section_name}`,
            portion: cls.portion,
          });
        });
      }
    }

    // ✅ Create and save the Sunday Exam
    const exam = new SundayExam({
      examName,
      examDate,
      registerBefore,
      examcenter,
      description,
      examBy,
      classExams: expandedClassExams,
      teacherExam,
    });

    await exam.save();

    // ✅ Response
    res.status(201).json({
      success: true,
      message: "Sunday School Exam created successfully for all sections",
      exam,
    });
  } catch (err) {
    console.error("Error creating Sunday School Exam:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// Get all Sunday Exams
exports.getSundayExams = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;

    const query = {};

    // Search by exam name
    if (search) {
      query.examName = { $regex: search, $options: "i" };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    }

    const total = await SundayExam.countDocuments(query);
    const exams = await SundayExam.find(query)
      .sort({ examDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("examBy", "name");

    res.status(200).json({
      exams,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};

// Get single exam by ID
exports.getSundayExamById = async (req, res) => {
  try {
    const exam = await SundayExam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.status(200).json({ exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};


exports.addExamBy = async (req, res) => {
  try {
    let { name } = req.body;
    const names = Array.isArray(name)
      ? name.map(n => n.trim()).filter(Boolean)
      : [name.trim()].filter(Boolean);

    if (!names.length) {
      return res.status(400).json({ status: "Failed", message: "Exam By name(s) required" });
    }

    const existingDocs = await SundayExamBy.find({ name: { $in: names } });
    const existingNames = existingDocs.map(d => d.name);
    const newNames = names.filter(n => !existingNames.includes(n));

    if (!newNames.length) {
      return res.status(400).json({ status: "Failed", message: "All Exam Bys already exist" });
    }

    const examBys = await SundayExamBy.insertMany(newNames.map(n => ({ name: n })));
    res.status(201).json({
      status: "Success",
      message: `Added ${examBys.length} Exam By(s)`,
      examBys,
      duplicates: existingNames
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


exports.updateExamBy = async (req, res) => {
  try {
    let { names } = req.body; // array of names
    if (!Array.isArray(names)) return res.status(400).json({ status: "Failed", message: "names must be an array" });

    names = names.map(n => n.trim()).filter(Boolean);

    // Remove Exam Bys not in the new list
    await SundayExamBy.deleteMany({ name: { $nin: names } });

    // Add new Exam Bys
    const existingDocs = await SundayExamBy.find({ name: { $in: names } });
    const existingNames = existingDocs.map(d => d.name);
    const newNames = names.filter(n => !existingNames.includes(n));
    if (newNames.length) {
      await SundayExamBy.insertMany(newNames.map(n => ({ name: n })));
    }

    const allExamBys = await SundayExamBy.find().sort({ name: 1 });
    res.status(200).json({
      status: "Success",
      message: "Exam Bys updated successfully",
      examBys: allExamBys
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "Failed", message: "Internal Server Error" });
  }
};


exports.getExamByList = async (req, res) => {
  try {
    const examBys = await SundayExamBy.find().sort({ name: 1 });
    res.status(200).json({ examBys });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch Exam By list" });
  }
};


// exports.updateSundayExam = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { examName, examDate, registerBefore, examcenter, description, examBy, classExams, teacherExam } = req.body;

//     const exam = await SundayExam.findByIdAndUpdate(
//       id,
//       { examName, examDate, registerBefore, examcenter, description, examBy, classExams, teacherExam },
//       { new: true } // return updated doc
//     );

//     if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

//     res.status(200).json({ success: true, exam });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Failed to update exam" });
//   }
// };

exports.updateSundayExam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      examName,
      examDate,
      registerBefore,
      examcenter,
      description,
      examBy,
      classExams = [],
      teacherExam,
    } = req.body;

    // 1️⃣ Fetch existing exam
    const exam = await SundayExam.findById(id);
    if (!exam) {
      return res
        .status(404)
        .json({ success: false, message: "Exam not found" });
    }

    // 2️⃣ Prepare mergedClassExams (expand + preserve existing participants)
    let mergedClassExams = [];

    for (const incoming of classExams) {
      const baseName = incoming.className.split(" - ")[0].trim();

      // Find all matching sections in DB
      const sections = await SundaySchoolClass.find({
        class_name: { $regex: `^${baseName}`, $options: "i" },
      });

      if (sections.length === 0) {
        // If no matching sections found, keep original
        mergedClassExams.push({
          className: incoming.className,
          portion: incoming.portion,
          participants: [],
          _id: exam.classExams.find(
            (ce) => ce.className === incoming.className
          )?._id,
        });
      } else {
        // Expand to all matching sections
        for (const sec of sections) {
          const fullName = `${sec.class_name} - ${sec.section_name}`;
          const existing = exam.classExams.find(
            (ce) => ce.className === fullName
          );

          // Avoid duplicates
          if (!mergedClassExams.find((ce) => ce.className === fullName)) {
            mergedClassExams.push({
              className: fullName,
              portion: incoming.portion,
              participants: existing ? existing.participants : [],
              _id: existing?._id,
            });
          }
        }
      }
    }

    // 3️⃣ Update exam fields
    exam.examName = examName;
    exam.examDate = examDate;
    exam.registerBefore = registerBefore;
    exam.examcenter = examcenter;
    exam.description = description;
    exam.examBy = examBy;
    exam.classExams = mergedClassExams;
    exam.teacherExam = teacherExam;

    await exam.save();

    // 4️⃣ Respond with success
    res.status(200).json({
      success: true,
      message: "Sunday School Exam updated successfully",
      exam,
    });
  } catch (err) {
    console.error("Failed to update Sunday School Exam:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update exam" });
  }
};

exports.getExamsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { search = "", startDate, endDate, page = 1, limit = 10 } = req.query;

    // 1️⃣ Find all classes this teacher handles
    const classes = await SundaySchoolClass.find({
      "teacher.member_id": teacherId,
    }).lean();

    if (!classes || classes.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        totalPages: 1,
        exams: [],
      });
    }

    // 2️⃣ Combine class_name + section_name to match classExams.className
    const classNames = classes.map(
      (c) => `${c.class_name} - ${c.section_name}`
    );

    // 3️⃣ Build filter
    const filter = {
      classExams: { $elemMatch: { className: { $in: classNames } } },
    };

    // Search by exam name
    if (search) {
      filter.examName = { $regex: search, $options: "i" };
    }

    // Date filter
    if (startDate || endDate) {
      filter.examDate = {};
      if (startDate) filter.examDate.$gte = new Date(startDate);
      if (endDate) filter.examDate.$lte = new Date(endDate);
    }

    // 4️⃣ Pagination setup
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 5️⃣ Fetch filtered exams
    const total = await SundayExam.countDocuments(filter);

    const exams = await SundayExam.find(filter)
      .populate("examBy", "name")
      .sort({ examDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 6️⃣ Filter each exam’s classExams array to include only teacher’s classes
    const filteredExams = exams.map((exam) => ({
      ...exam,
      classExams: exam.classExams.filter((ce) =>
        classNames.includes(ce.className)
      ),
    }));

    return res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      exams: filteredExams,
    });
  } catch (err) {
    console.error("Error fetching exams for teacher:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching teacher's exams",
      error: err.message,
    });
  }
};

// POST /sundayschool-exams/add-participants
exports.addExamParticipants = async (req, res) => {
  try {
    const { examId, className, participants } = req.body;

    if (!examId || !className || !participants) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exam = await SundayExam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Find the class inside classExams
    const classExam = exam.classExams.find((c) => c.className === className);
    if (!classExam) return res.status(404).json({ message: "Class not found in this exam" });

    // Replace or add participants
    classExam.participants = participants;

    await exam.save();

    res.status(200).json({ success: true, message: "Participants added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save participants", error: err.message });
  }
};

exports.addMarks = async (req, res) => {
  try {
    const { examId, className, marksData } = req.body;

    if (!examId || !className || !marksData || !Array.isArray(marksData)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // ✅ Find the exam
    const exam = await SundayExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // ✅ Find the class exam inside it
    const classExam = exam.classExams.find(
      (cls) => cls.className === className
    );
    if (!classExam) {
      return res.status(404).json({ message: "Class not found in exam" });
    }

    // ✅ Check if marks already exist for all participants
    const alreadyHasMarks = classExam.participants.every(
      (p) => p.marks !== null && p.marks !== undefined
    );

    if (alreadyHasMarks) {
      return res
        .status(400)
        .json({ message: "Marks already added for this class." });
    }

    // ✅ Add marks for each participant
    marksData.forEach((student) => {
      const participant = classExam.participants.find(
        (p) => p.member_id === student.member_id
      );
      if (participant) {
        participant.marks = student.marks ?? 0;
      }
    });

    await exam.save();

    res.json({ message: "Marks saved successfully!", hasMarks: true });
  } catch (error) {
    console.error("Error saving marks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addTeacher = async (req, res) => {
  try {
    const { examId, teacher } = req.body;
    if (!examId || !teacher || !teacher.teacherName || !teacher.className) {
      return res.status(400).json({ success: false, message: "Exam ID and teacher info required." });
    }

    const exam = await SundayExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    // Prevent duplicate enrollment for same class/teacher
    const alreadyEnrolled = exam.teacherDetails.some(
      t => t.teacherId === teacher.teacherId && t.className === teacher.className
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: "Teacher already enrolled for this class portion." });
    }

    exam.teacherDetails.push({
      teacherId: teacher.teacherId,
      teacherName: teacher.teacherName,
      className: teacher.className,
    });

    await exam.save();

    return res.status(200).json({ success: true, message: "Teacher enrolled successfully!" });
  } catch (err) {
    console.error("Add teacher error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateMarks = async (req, res) => {
  try {
    const { examId, className, marksData } = req.body;

    if (!examId || !className || !Array.isArray(marksData)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const exam = await SundayExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const classExam = exam.classExams.find(cls => cls.className === className);
    if (!classExam) {
      return res.status(404).json({ message: "Class not found in exam" });
    }

    // ✅ Update marks for existing participants
    marksData.forEach(student => {
      const participant = classExam.participants.find(
        p => p.member_id === student.member_id
      );
      if (participant) {
        participant.marks = student.marks ?? 0;
      }
    });

    await exam.save();
    res.json({ message: "Marks updated successfully!" });
  } catch (error) {
    console.error("Error updating marks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
