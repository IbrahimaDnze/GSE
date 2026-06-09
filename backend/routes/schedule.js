const express = require('express');
const ScheduleEvent = require('../models/ScheduleEvent');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { className } = req.query;
    const filter = {};
    if (className) filter.className = className;
    const events = await ScheduleEvent.find(filter).sort({ day: 1, time: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const event = await ScheduleEvent.create(req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await ScheduleEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Evenement supprime' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
