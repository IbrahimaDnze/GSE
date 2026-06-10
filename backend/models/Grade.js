const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  matricule: { type: String },
  class: { type: String, required: true },
  trimestre: { type: String, enum: ['T1', 'T2', 'T3'], required: true },
  photo: { type: String },
  grades: { type: Map, of: Number },
}, { timestamps: true, strict: false });

gradeSchema.index({ studentName: 1, class: 1, trimestre: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
