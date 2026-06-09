const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  niveau: { type: String, required: true },
  description: { type: String },
  max: { type: Number, default: 0 },
  subjects: { type: Number, default: 0 },
  actif: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
