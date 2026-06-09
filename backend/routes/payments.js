const express = require('express');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { student, type, mois, status } = req.query;
    const filter = {};
    if (student) filter.student = student;
    if (type) filter.type = type;
    if (mois) filter.mois = mois;
    if (status) filter.status = status;
    const payments = await Payment.find(filter).populate('student', 'name matricule photo').sort({ datePaiement: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/impayes', protect, async (req, res) => {
  try {
    const { mois, annee } = req.query;
    const m = mois || String(new Date().getMonth() + 1).padStart(2, '0');
    const a = annee || new Date().getFullYear();
    const payeIds = await Payment.distinct('student', { type: 'mensualite', mois: m, annee: parseInt(a), status: 'Payé' });
    const impayes = await Student.find({ status: 'Actif', _id: { $nin: payeIds } }).select('name matricule photo class parent parentPhone');
    res.json(impayes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('student');
    if (!payment) return res.status(404).json({ message: 'Paiement non trouve' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const data = { ...req.body, enregistrePar: req.user._id };
    const payment = await Payment.create(data);
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ message: 'Paiement non trouve' });
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Paiement non trouve' });
    res.json({ message: 'Paiement supprime' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
