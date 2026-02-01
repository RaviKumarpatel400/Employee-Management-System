const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Manager', 'Employee'], required: true },
  department: { type: String }, // Required for Manager & Employee
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For Employee
  employeeId: { type: String, unique: true, sparse: true }, // Custom ID for Employee
  firstLogin: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
