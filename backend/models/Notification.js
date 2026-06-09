const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['payment', 'alert', 'event', 'grade', 'enroll'], default: 'event' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  important: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  time: { type: String, default: "À l'instant" },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
