const express = require('express');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const enrollments = await Enrollment.find(filter).sort({ createdAt: -1 });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Inscription non trouvee' });
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.create(req.body);
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!enrollment) return res.status(404).json({ message: 'Inscription non trouvee' });
    res.json(enrollment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Inscription non trouvee' });
    res.json({ message: 'Inscription supprimee' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
