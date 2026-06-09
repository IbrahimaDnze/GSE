const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String },
  type: { type: String, enum: ['inscription', 'mensualite', 'autre'], required: true },
  montant: { type: Number, required: true },
  mois: { type: String },
  annee: { type: Number },
  datePaiement: { type: Date, default: Date.now },
  modePaiement: { type: String, enum: ['Espèces', 'Chèque', 'Virement', 'Autre'], default: 'Espèces' },
  reference: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['Payé', 'En retard', 'Impayé'], default: 'Payé' },
  enregistrePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
