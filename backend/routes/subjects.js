const express = require('express');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');
const router = express.Router();

const DEFAULT_SUBJECTS = ['Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 'Histoire-Géographie', 'SVT', 'Informatique'];

router.get('/', protect, async (req, res) => {
  try {
    let subjects = await Subject.find().sort('name');
    if (subjects.length === 0) {
      const docs = await Subject.insertMany(DEFAULT_SUBJECTS.map(s => ({ name: s })));
      subjects = docs;
    }
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, level } = req.body;
    if (!name) return res.status(400).json({ message: 'Nom requis' });
    const existing = await Subject.findOne({ name, level: level || '' });
    if (existing) return res.status(400).json({ message: 'Cette matière existe déjà pour ce niveau' });
    const subject = await Subject.create({ name, level: level || '' });
    res.status(201).json(subject);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Cette matière existe déjà pour ce niveau' });
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Matiere non trouvee' });
    res.json({ message: 'Matiere supprimee' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
