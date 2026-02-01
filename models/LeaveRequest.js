const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Assigned manager at time of application
  leaveType: { type: String, enum: ['Vacation', 'Sick', 'Casual'], required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  managerComment: { type: String },
  days: { type: Number, required: true } // Store calculated days
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
