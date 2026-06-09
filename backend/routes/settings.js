const express = require('express');
const Setting = require('../models/Setting');
const { protect, autoriserRoles } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/', protect, autoriserRoles('admin', 'directeur'), async (req, res) => {
  try {
    const data = req.body;
    if (data.logo && data.logo.startsWith('data:')) data.logo = await uploadImage(data.logo, 'settings');
    if (data.signature && data.signature.startsWith('data:')) data.signature = await uploadImage(data.signature, 'settings');
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create(data);
    else {
      Object.assign(settings, data);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
