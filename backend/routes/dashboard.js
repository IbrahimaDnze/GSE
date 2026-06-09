const express = require('express');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Payment = require('../models/Payment');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Grade = require('../models/Grade');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Actif' });
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: 'Actif' });
    const totalClasses = await Class.countDocuments({ actif: true });
    const totalEnrollments = await Enrollment.countDocuments();
    const pendingEnrollments = await Enrollment.countDocuments({ status: 'En attente' });
    const totalPayments = await Payment.countDocuments();
    const totalRevenue = await Payment.aggregate([{ $group: { _id: null, total: { $sum: '$montant' } } }]);
    const totalGrades = await Grade.countDocuments();

    res.json({
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalClasses,
      totalEnrollments,
      pendingEnrollments,
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalGrades,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
