const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Subject = require('./models/Subject');
const Setting = require('./models/Setting');

const DEFAULT_SUBJECTS = ['Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 'Histoire-Géographie', 'SVT', 'Informatique'];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ email: 'admin@ecole.com' });
    if (!adminExists) {
      await User.create({
        nom: 'Admin',
        email: 'admin@ecole.com',
        motDePasse: 'admin123',
        role: 'admin',
        actif: true,
      });
      console.log('Admin user created: admin@ecole.com / admin123');
    } else {
      console.log('Admin user already exists');
    }

    const subjectCount = await Subject.countDocuments();
    if (subjectCount === 0) {
      await Subject.insertMany(DEFAULT_SUBJECTS.map(s => ({ name: s })));
      console.log('Default subjects created');
    } else {
      console.log('Subjects already exist');
    }

    const settingCount = await Setting.countDocuments();
    if (settingCount === 0) {
      await Setting.create({ schoolName: 'École Privée', schoolYear: '2025-2026' });
      console.log('Default settings created');
    } else {
      console.log('Settings already exist');
    }

    console.log('Seed completed');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
