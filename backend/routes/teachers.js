const express = require('express');
const Teacher = require('../models/Teacher');
const ScheduleEvent = require('../models/ScheduleEvent');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { status, matiere, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (matiere) filter.matieres = { $in: [matiere] };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const teachers = await Teacher.find(filter).sort({ createdAt: -1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Enseignant non trouve' });
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const data = req.body;
    if (data.photo) data.photo = await uploadImage(data.photo, 'teachers');
    const teacher = await Teacher.create(data);
    res.status(201).json(teacher);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `Cet ${field === 'identifiant' ? 'identifiant' : 'email'} est déjà utilisé` });
    }
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const data = req.body;
    if (data.photo && data.photo.startsWith('data:')) data.photo = await uploadImage(data.photo, 'teachers');
    const old = await Teacher.findById(req.params.id);
    if (!old) return res.status(404).json({ message: 'Enseignant non trouve' });
    const oldName = old.name;
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (data.name && data.name !== oldName) {
      await ScheduleEvent.updateMany({ teacher: oldName }, { teacher: data.name });
    }
    res.json(teacher);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `Cet ${field === 'identifiant' ? 'identifiant' : 'email'} est déjà utilisé` });
    }
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Enseignant non trouve' });
    await ScheduleEvent.updateMany({ teacher: teacher.name }, { teacher: '' });
    res.json({ message: 'Enseignant supprime' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
