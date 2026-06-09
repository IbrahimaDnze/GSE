const express = require('express');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { class: cls, trimestre } = req.query;
    const filter = {};
    if (cls) filter.class = cls;
    if (trimestre) filter.trimestre = trimestre;
    const grades = await Grade.find(filter).sort({ studentName: 1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Notes non trouvees' });
    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { studentName, class: cls, trimestre } = req.body;
    const existing = await Grade.findOne({ studentName, class: cls, trimestre });
    if (existing) {
      const updated = await Grade.findByIdAndUpdate(existing._id, req.body, { new: true });
      return res.json(updated);
    }
    const grade = await Grade.create(req.body);
    res.status(201).json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grade) return res.status(404).json({ message: 'Notes non trouvees' });
    res.json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Notes non trouvees' });
    res.json({ message: 'Notes supprimees' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
