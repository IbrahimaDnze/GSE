const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find().sort('-createdAt').limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    const io = req.app.get('io');
    if (io) io.to('all').emit('new_notification', notification);
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notif) return res.status(404).json({ message: 'Notification introuvable' });
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ message: 'Tout marque comme lu' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification supprimee' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
