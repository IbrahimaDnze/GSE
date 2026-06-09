const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  matricule: { type: String, unique: true, sparse: true },
  dob: { type: String },
  birthPlace: { type: String },
  gender: { type: String, enum: ['Masculin', 'Féminin'] },
  photo: { type: String },
  address: { type: String },
  class: { type: String },
  schoolYear: { type: String },
  filiations: { type: String },
  parent: { type: String },
  parentPhone: { type: String },
  status: { type: String, enum: ['Actif', 'Inactif'], default: 'Actif' },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
