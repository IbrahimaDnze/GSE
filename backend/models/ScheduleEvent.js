const mongoose = require('mongoose');

const scheduleEventSchema = new mongoose.Schema({
  className: { type: String, required: true },
  day: { type: String, required: true },
  time: { type: String },
  subject: { type: String },
  teacher: { type: String },
  room: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ScheduleEvent', scheduleEventSchema);
