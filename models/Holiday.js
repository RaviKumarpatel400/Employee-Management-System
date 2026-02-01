const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true, unique: true },
  type: { type: String, enum: ['National', 'Company', 'Regional', 'Other'], default: 'Company' }
}, { timestamps: true });

module.exports = mongoose.model('Holiday', HolidaySchema);
