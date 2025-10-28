const mongoose = require("mongoose");


const participantSchema = new mongoose.Schema({
  member_id: { type: String, required: true },
  member_name: { type: String, required: true },
  class_name: { type: String, required: true },
  section_name: { type: String },
  marks: { type: Number, default: null },
});

const classExamSchema = new mongoose.Schema({
  className: { type: String, required: true },
  portion: { type: String, required: true },
  participants: [participantSchema],
});

const sundayExamSchema = new mongoose.Schema({
  examName: { type: String, required: true },
  examDate: { type: Date, required: true },
  registerBefore: { type: Date, required: true },
  examcenter: { type: String, required: true },
  description: { type: String },
  examBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SundayExamBy",
        required: true,   
      },
    ],
  classExams: [classExamSchema],
  teacherExam: { type: String }, // teacher portion
  teacherDetails: [   // NEW: store enrolled teacher names for portions
    {
      teacherId: { type: String, required: true },
      teacherName: { type: String, required: true },
      className: { type: String, required: true },
    }
  ],
}, { timestamps: true });
 
module.exports = mongoose.model("SundayExam", sundayExamSchema);
