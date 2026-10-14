const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required'],
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: [true, 'Date is required'],
    index: true,
  },
  timeIn: {
    type: String, // e.g., "08:55 AM"
    default: null,
  },
  timeOut: {
    type: String, // e.g., "05:05 PM"
    default: null,
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent', 'Half-Day', 'On Leave'],
    default: 'Present',
  },
  workHours: {
    type: Number,
    default: 0,
  },
  lateMinutes: {
    type: Number,
    default: 0,
  },
  method: {
    type: String,
    enum: ['Web Clock-In', 'Admin Manual', 'Biometric', 'RFID', 'System Auto'],
    default: 'Web Clock-In',
  },
  notes: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    default: 'Main Office',
  }
}, {
  timestamps: true
});

// Compound index to ensure 1 attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
