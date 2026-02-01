const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken, authorizeRole(['Employee']));

// Helper to calculate days excluding weekends and holidays
const calculateLeaveDays = async (start, end) => {
  let count = 0;
  let currentDate = new Date(start);
  const endDate = new Date(end);
  
  // Fetch holidays
  let holidayStrings = [];
  try {
    const holidays = await Holiday.find({}, 'date');
    holidayStrings = holidays.map(h => h.date.toISOString().split('T')[0]);
  } catch (e) {
    holidayStrings = [];
  }

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateString = currentDate.toISOString().split('T')[0];

    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayStrings.includes(dateString)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
};

// Apply for Leave
router.post('/apply-leave', async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    
    // Validate Dates
    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: 'From Date cannot be after To Date' });
    }

    // Calculate Days
    const days = await calculateLeaveDays(fromDate, toDate);
    if (days <= 0) {
      return res.status(400).json({ message: 'Selected range has 0 working days' });
    }

    // Get Manager ID (from User profile)
    const user = await User.findById(req.user.id);
    if (!user.managerId) {
      return res.status(400).json({ message: 'No manager assigned to you' });
    }

    // Create Request
    const leaveRequest = new LeaveRequest({
      employeeId: req.user.id,
      managerId: user.managerId,
      leaveType,
      fromDate,
      toDate,
      reason,
      days
    });

    await leaveRequest.save();
    
    try {
      await ActivityLog.create({
        userId: req.user.id,
        role: 'Employee',
        action: 'apply_leave',
        message: `${leaveType} leave applied: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()} (${days} days)`,
        meta: { leaveRequestId: leaveRequest._id, leaveType, days, fromDate, toDate }
      });
    } catch (_) {}
    res.json(leaveRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// View My Leaves
router.get('/my-leaves', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.user.id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// View Balance
router.get('/balance', async (req, res) => {
  try {
    const balance = await LeaveBalance.findOne({ employeeId: req.user.id });
    if (!balance) return res.status(404).json({ message: 'Balance not found' });
    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// View Calendar (Approved Leaves + Holidays)
router.get('/calendar', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ employeeId: req.user.id, status: 'Approved' });
    let holidays = [];
    try {
      holidays = await Holiday.find();
    } catch (e) {
      holidays = [];
    }
    res.json({ leaves, holidays });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Holidays (for calculation)
router.get('/holidays', async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.json(holidays);
  } catch (err) {
    res.json([]); // Fallback so client can continue without blocking
  }
});

// Recent Activity
router.get('/activity', async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

module.exports = router;
