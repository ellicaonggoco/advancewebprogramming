const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required'],
  },
  leaveType: {
    type: String,
    enum: ['Vacation Leave', 'Sick Leave', 'Emergency Leave', 'Maternity/Paternity Leave', 'Bereavement Leave'],
    required: [true, 'Leave type is required'],
  },
  startDate: {
    type: String, // YYYY-MM-DD
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: String, // YYYY-MM-DD
    required: [true, 'End date is required'],
  },
  daysCount: {
    type: Number,
    required: [true, 'Number of days is required'],
    min: [1, 'Must be at least 1 day'],
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  reviewedBy: {
    type: String,
    default: null,
  },
  reviewNotes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
