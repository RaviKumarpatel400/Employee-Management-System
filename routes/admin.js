const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');
const Announcement = require('../models/Announcement');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Middleware for all admin routes
router.use(authenticateToken, authorizeRole(['Admin']));

// Helper to generate password
const generatePassword = (prefix) => {
  const randomNum = Math.floor(10 + Math.random() * 90); // 2 digit
  return `${prefix}${randomNum}`;
};

const generateEmployeeId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit
  return `EMP-${randomNum}`;
};

// Create Manager
router.post('/create-manager', async (req, res) => {
  try {
    const { name, email, department } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const deptPrefix = department.substring(0, 2).toUpperCase();
    const rawPassword = `M-${deptPrefix}${Math.floor(10 + Math.random() * 90)}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const manager = new User({
      name,
      email,
      password: hashedPassword,
      role: 'Manager',
      department,
      firstLogin: true
    });

    await manager.save();
    res.json({ message: 'Manager created successfully', password: rawPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Managers by Department (for Employee creation dropdown)
router.get('/managers/:department', async (req, res) => {
  try {
    const managers = await User.find({ role: 'Manager', department: req.params.department }, 'name _id');
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Employee
router.post('/create-employee', async (req, res) => {
  try {
    const { name, email, department, managerId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const employeeId = generateEmployeeId();
    // Secure random password
    const rawPassword = Math.random().toString(36).slice(-8); 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const employee = new User({
      name,
      email,
      password: hashedPassword,
      role: 'Employee',
      department,
      managerId,
      employeeId,
      firstLogin: true
    });

    await employee.save();

    // Initialize Leave Balance
    const balance = new LeaveBalance({ employeeId: employee._id });
    await balance.save();

    res.json({ message: 'Employee created successfully', password: rawPassword, employeeId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manage Holidays
router.post('/holidays', async (req, res) => {
  try {
    const { name, date } = req.body;
    const holiday = new Holiday({ name, date });
    await holiday.save();
    res.json(holiday);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/holidays', async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Holiday
router.delete('/holidays/:id', async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: 'Holiday deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard Stats
router.get('/stats', async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'Employee' });
    const totalManagers = await User.countDocuments({ role: 'Manager' });
    
    // Aggregate managers by department
    const managersByDept = await User.aggregate([
      { $match: { role: 'Manager' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    res.json({ totalEmployees, totalManagers, managersByDept });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manage Announcements
router.post('/announcements', async (req, res) => {
  try {
    const { title, content } = req.body;
    const announcement = new Announcement({ title, content });
    await announcement.save();
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
