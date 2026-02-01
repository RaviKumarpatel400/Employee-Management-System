const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const Holiday = require('../models/Holiday');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken, authorizeRole(['Manager']));

// Get Leave Requests for Team
router.get('/leaves', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ managerId: req.user.id })
      .populate('employeeId', 'name email employeeId')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve/Reject Leave
router.put('/leaves/:id', async (req, res) => {
  try {
    const { status, comment } = req.body;
    const leaveId = req.params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (!comment) {
      return res.status(400).json({ message: 'Comment is mandatory' });
    }

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Leave request already processed' });
    }

    // If Approving, check and deduct balance
    if (status === 'Approved') {
      const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId });
      const type = leave.leaveType.toLowerCase(); // vacation, sick, casual
      const usedField = `${type}Used`;
      const totalField = `${type}Total`;

      if (balance[usedField] + leave.days > balance[totalField]) {
         return res.status(400).json({ message: 'Insufficient leave balance for employee' });
      }

      balance[usedField] += leave.days;
      await balance.save();
    }

    leave.status = status;
    leave.managerComment = comment;
    await leave.save();

    try {
      await ActivityLog.create({
        userId: req.user.id,
        role: 'Manager',
        action: `leave_${status.toLowerCase()}`,
        message: `${status} leave for ${leave.employeeId} (${leave.leaveType}, ${leave.days} days)`,
        meta: { leaveRequestId: leave._id, employeeId: leave.employeeId, leaveType: leave.leaveType, days: leave.days }
      });
    } catch (_) {}

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Team Calendar (Approved Leaves)
router.get('/calendar', async (req, res) => {
  try {
    // Find all employees managed by this user
    const employees = await User.find({ managerId: req.user.id }, '_id');
    const employeeIds = employees.map(e => e._id);

    const leaves = await LeaveRequest.find({
      employeeId: { $in: employeeIds },
      status: 'Approved'
    }).populate('employeeId', 'name employeeId');
    
    const holidays = await Holiday.find();

    res.json({ leaves, holidays, teamSize: employees.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

router.get('/team-activity', async (req, res) => {
  try {
    const employees = await User.find({ managerId: req.user.id }, '_id');
    const employeeIds = employees.map(e => e._id);
    const logs = await ActivityLog.find({ userId: { $in: employeeIds } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'name employeeId');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Team Leaves (History)
router.get('/history', async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ managerId: req.user.id })
      .populate('employeeId', 'name email employeeId')
      .sort({ updatedAt: -1 }); // Recently processed first
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
