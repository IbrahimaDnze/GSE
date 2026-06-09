const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  adresse: { type: String },
  identifiant: { type: String, unique: true, sparse: true },
  dateNaissance: { type: Date },
  lieuNaissance: { type: String },
  gender: { type: String },
  photo: { type: String },
  matieres: [{ type: String }],
  classes: [{ type: String }],
  diplomes: [{ type: String }],
  dateRecrutement: { type: Date, default: Date.now },
  salaire: { type: Number, default: 0 },
  status: { type: String, enum: ['Actif', 'Inactif', 'Congé'], default: 'Actif' },
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
