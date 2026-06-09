const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  matricule: { type: String },
  photo: { type: String },
  parent: { type: String },
  parentPhone: { type: String },
  parentEmail: { type: String },
  classReq: { type: String },
  schoolYear: { type: String },
  docs: { type: Boolean, default: false },
  status: { type: String, enum: ['En attente', 'Accepté', 'Refusé'], default: 'En attente' },
  date: { type: String, default: () => new Date().toLocaleDateString('fr-FR') },
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
