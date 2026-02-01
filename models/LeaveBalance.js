const mongoose = require('mongoose');

const LeaveBalanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  vacationTotal: { type: Number, default: 20 },
  vacationUsed: { type: Number, default: 0 },
  
  sickTotal: { type: Number, default: 10 },
  sickUsed: { type: Number, default: 0 },
  
  casualTotal: { type: Number, default: 5 },
  casualUsed: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('LeaveBalance', LeaveBalanceSchema);
