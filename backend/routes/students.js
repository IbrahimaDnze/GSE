const express = require('express');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Grade = require('../models/Grade');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { class: cls, status, search } = req.query;
    const filter = {};
    if (cls) filter.class = cls;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Eleve non trouve' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const data = req.body;
    if (data.photo) data.photo = await uploadImage(data.photo, 'students');
    const student = await Student.create(data);
    res.status(201).json(student);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Ce matricule est déjà utilisé' });
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const data = req.body;
    if (data.photo && data.photo.startsWith('data:')) data.photo = await uploadImage(data.photo, 'students');
    const old = await Student.findById(req.params.id);
    if (!old) return res.status(404).json({ message: 'Eleve non trouve' });
    const student = await Student.findByIdAndUpdate(req.params.id, data, { new: true });
    const enrollmentUpdates = {};
    if (data.name !== undefined && data.name !== old.name) enrollmentUpdates.student = data.name;
    if (data.parent !== undefined && data.parent !== old.parent) enrollmentUpdates.parent = data.parent;
    if (data.parentPhone !== undefined && data.parentPhone !== old.parentPhone) enrollmentUpdates.parentPhone = data.parentPhone;
    if (data.photo !== undefined && data.photo !== old.photo) enrollmentUpdates.photo = data.photo;
    if (data.matricule !== undefined && data.matricule !== old.matricule) enrollmentUpdates.matricule = data.matricule;
    if (data.gender !== undefined && data.gender !== old.gender) enrollmentUpdates.gender = data.gender;
    if (data.class !== undefined && data.class !== old.class) enrollmentUpdates.classReq = data.class;
    if (Object.keys(enrollmentUpdates).length > 0) {
      const oldNameEscaped = old.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await Enrollment.updateMany(
        { $or: [{ studentId: req.params.id }, { student: { $regex: `^${oldNameEscaped}$`, $options: 'i' } }] },
        { $set: enrollmentUpdates }
      );
    }
    if (data.name && data.name !== old.name) {
      await Payment.updateMany({ student: req.params.id }, { studentName: data.name });
      await Grade.updateMany({ studentId: req.params.id }, { studentName: data.name });
    }
    res.json(student);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Ce matricule est déjà utilisé' });
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Eleve non trouve' });

    const name = student.name.trim();

    await Enrollment.deleteMany({
      $or: [
        { studentId: req.params.id },
        { student: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }
      ]
    });
    await Payment.deleteMany({ student: req.params.id });
    await Grade.deleteMany({ studentId: req.params.id });
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Eleve supprime avec ses donnees liees' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
