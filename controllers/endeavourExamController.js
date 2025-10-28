// controllers/endeavourExamController.js

const EndeavourExam = require("../Schema/endeavourExamSchema");
const EndeavourExamBy = require("../Schema/endeavourExamBySchema");
const EndeavourClass = require("../Schema/EndeavourClass");

// Create a new Endeavour Exam
// exports.createEndeavourExam = async (req, res) => {
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

//     const exam = new EndeavourExam({
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

exports.createEndeavourExam = async (req, res) => {
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

    // ✅ Clean class exams: remove rows with missing className or portion
    classExams = classExams
      .filter((cls) => cls.className && cls.portion?.trim());

    // ✅ Expand grouped class names (like "Primary", "Junior") to all sections
    let expandedClassExams = [];
    for (const cls of classExams) {
      // Find all matching sections in DB
      const sections = await EndeavourClass.find({ class_name: { $regex: `^${cls.className.split(" - ")[0].trim()}` } });
      if (sections.length === 0) {
        // fallback to original if no sections found
        expandedClassExams.push(cls);
      } else {
        sections.forEach((sec) => {
          expandedClassExams.push({
            className: `${sec.class_name} - ${sec.section_name}`,
            portion: cls.portion,
          });
        });
      }
    }

    // ✅ Create and save the exam
    const exam = new EndeavourExam({
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

    res.status(201).json({
      success: true,
      message: "Exam created successfully for all sections",
      exam,
    });
  } catch (err) {
    console.error("Error creating Endeavour Exam:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// Get all Endeavour Exams
exports.getEndeavourExams = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;

    const query = {};

    if (search) {
      query.examName = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    }

    const total = await EndeavourExam.countDocuments(query);
    const exams = await EndeavourExam.find(query)
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
exports.getEndeavourExamById = async (req, res) => {
  try {
    const exam = await EndeavourExam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.status(200).json({ exam });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exam" });
  }
};

// Add Exam By (Organizers)
exports.addEndeavourExamBy = async (req, res) => {
  try {
    let { name } = req.body;
    const names = Array.isArray(name)
      ? name.map(n => n.trim()).filter(Boolean)
      : [name.trim()].filter(Boolean);

    if (!names.length) {
      return res.status(400).json({ status: "Failed", message: "Exam By name(s) required" });
    }

    const existingDocs = await EndeavourExamBy.find({ name: { $in: names } });
    const existingNames = existingDocs.map(d => d.name);
    const newNames = names.filter(n => !existingNames.includes(n));

    if (!newNames.length) {
      return res.status(400).json({ status: "Failed", message: "All Exam Bys already exist" });
    }

    const examBys = await EndeavourExamBy.insertMany(newNames.map(n => ({ name: n })));
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

// Update Exam By
exports.updateEndeavourExamBy = async (req, res) => {
  try {
    let { names } = req.body; 
    if (!Array.isArray(names)) return res.status(400).json({ status: "Failed", message: "names must be an array" });

    names = names.map(n => n.trim()).filter(Boolean);

    await EndeavourExamBy.deleteMany({ name: { $nin: names } });

    const existingDocs = await EndeavourExamBy.find({ name: { $in: names } });
    const existingNames = existingDocs.map(d => d.name);
    const newNames = names.filter(n => !existingNames.includes(n));
    if (newNames.length) {
      await EndeavourExamBy.insertMany(newNames.map(n => ({ name: n })));
    }

    const allExamBys = await EndeavourExamBy.find().sort({ name: 1 });
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

// Get Exam By List
exports.getEndeavourExamByList = async (req, res) => {
  try {
    const examBys = await EndeavourExamBy.find().sort({ name: 1 });
    res.status(200).json({ examBys });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch Exam By list" });
  }
};

// Update Endeavour Exam
// exports.updateEndeavourExam = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { examName, examDate, registerBefore, examcenter, description, examBy, classExams, teacherExam } = req.body;

//     const exam = await EndeavourExam.findByIdAndUpdate(
//       id,
//       { examName, examDate, registerBefore, examcenter, description, examBy, classExams, teacherExam },
//       { new: true }
//     );

//     if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

//     res.status(200).json({ success: true, exam });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Failed to update exam" });
//   }
// };

exports.updateEndeavourExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { examName, examDate, registerBefore, examcenter, description, examBy, classExams = [], teacherExam } = req.body;

    // 1️⃣ Fetch existing exam
    const exam = await EndeavourExam.findById(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // 2️⃣ Prepare mergedClassExams
    let mergedClassExams = [];

    for (const incoming of classExams) {
      const baseName = incoming.className.split(" - ")[0].trim();

      // Find all matching sections in DB
      const sections = await EndeavourClass.find({ class_name: { $regex: `^${baseName}` } });

      if (sections.length === 0) {
        mergedClassExams.push({
          className: incoming.className,
          portion: incoming.portion,
          participants: [],
          _id: exam.classExams.find(ce => ce.className === incoming.className)?._id,
        });
      } else {
        for (const sec of sections) {
          const fullName = `${sec.class_name} - ${sec.section_name}`;

          // Check if this section already exists in exam.classExams
          const existing = exam.classExams.find(ce => ce.className === fullName);

          // Only push if it’s not already added in mergedClassExams
          if (!mergedClassExams.find(ce => ce.className === fullName)) {
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

    res.status(200).json({ success: true, exam });
  } catch (err) {
    console.error("Failed to update Endeavour Exam:", err);
    res.status(500).json({ success: false, message: "Failed to update exam" });
  }
};



// Get Exams by Teacher
exports.getEndeavourExamsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { search = "", startDate, endDate, page = 1, limit = 10 } = req.query;

    const classes = await EndeavourClass.find({
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

    const classNames = classes.map(c => `${c.class_name} - ${c.section_name}`);

    const filter = {
      classExams: { $elemMatch: { className: { $in: classNames } } },
    };

    if (search) filter.examName = { $regex: search, $options: "i" };

    if (startDate || endDate) {
      filter.examDate = {};
      if (startDate) filter.examDate.$gte = new Date(startDate);
      if (endDate) filter.examDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await EndeavourExam.countDocuments(filter);

    const exams = await EndeavourExam.find(filter)
      .populate("examBy", "name")
      .sort({ examDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const filteredExams = exams.map(exam => ({
      ...exam,
      classExams: exam.classExams.filter(ce => classNames.includes(ce.className)),
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

// Add Exam Participants
exports.addEndeavourExamParticipants = async (req, res) => {
  try {
    const { examId, className, participants } = req.body;
    if (!examId || !className || !participants) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exam = await EndeavourExam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const classExam = exam.classExams.find(c => c.className === className);
    if (!classExam) return res.status(404).json({ message: "Class not found in this exam" });

    classExam.participants = participants;

    await exam.save();
    res.status(200).json({ success: true, message: "Participants added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save participants", error: err.message });
  }
};

// Add Marks
exports.addEndeavourMarks = async (req, res) => {
  try {
    const { examId, className, marksData } = req.body;
    if (!examId || !className || !marksData || !Array.isArray(marksData)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const exam = await EndeavourExam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const classExam = exam.classExams.find(cls => cls.className === className);
    if (!classExam) return res.status(404).json({ message: "Class not found in exam" });

    const alreadyHasMarks = classExam.participants.every(p => p.marks !== null && p.marks !== undefined);
    if (alreadyHasMarks) return res.status(400).json({ message: "Marks already added for this class." });

    marksData.forEach(student => {
      const participant = classExam.participants.find(p => p.member_id === student.member_id);
      if (participant) participant.marks = student.marks ?? 0;
    });

    await exam.save();
    res.json({ message: "Marks saved successfully!", hasMarks: true });
  } catch (error) {
    console.error("Error saving marks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add Teacher
exports.addEndeavourTeacher = async (req, res) => {
  try {
    const { examId, teacher } = req.body;
    if (!examId || !teacher || !teacher.teacherName || !teacher.className) {
      return res.status(400).json({ success: false, message: "Exam ID and teacher info required." });
    }

    const exam = await EndeavourExam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found." });

    const alreadyEnrolled = exam.teacherDetails.some(
      t => t.teacherId === teacher.teacherId && t.className === teacher.className
    );
    if (alreadyEnrolled) return res.status(400).json({ success: false, message: "Teacher already enrolled for this class portion." });

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

// Update Marks
exports.updateEndeavourMarks = async (req, res) => {
  try {
    const { examId, className, marksData } = req.body;
    if (!examId || !className || !Array.isArray(marksData)) return res.status(400).json({ message: "Invalid request data" });

    const exam = await EndeavourExam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const classExam = exam.classExams.find(cls => cls.className === className);
    if (!classExam) return res.status(404).json({ message: "Class not found in exam" });

    marksData.forEach(student => {
      const participant = classExam.participants.find(p => p.member_id === student.member_id);
      if (participant) participant.marks = student.marks ?? 0;
    });

    await exam.save();
    res.json({ message: "Marks updated successfully!" });
  } catch (error) {
    console.error("Error updating marks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
