const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  schoolName: { type: String, default: 'École Privée' },
  schoolYear: { type: String, default: '2025-2026' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  currency: { type: String, default: 'Franc Guinée (GNF)' },
  logo: { type: String, default: '' },
  signature: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
