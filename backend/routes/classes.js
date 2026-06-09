const express = require('express');
const Class = require('../models/Class');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { niveau, actif } = req.query;
    const filter = {};
    if (niveau) filter.niveau = niveau;
    if (actif !== undefined) filter.actif = actif === 'true';
    const classes = await Class.find(filter).sort({ name: 1 });
    const result = await Promise.all(classes.map(async (c) => {
      const count = await Student.countDocuments({ class: c.name, status: 'Actif' });
      return { ...c.toObject(), nombreEleves: count };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Classe non trouvee' });
    const count = await Student.countDocuments({ class: cls.name, status: 'Actif' });
    res.json({ ...cls.toObject(), nombreEleves: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const cls = await Class.create(req.body);
    res.status(201).json(cls);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cls) return res.status(404).json({ message: 'Classe non trouvee' });
    res.json(cls);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Classe non trouvee' });
    res.json({ message: 'Classe supprimee' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
