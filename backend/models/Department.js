const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    unique: true,
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    trim: true,
    uppercase: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  managerName: {
    type: String,
    default: 'Unassigned',
  },
  budget: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for employee count
departmentSchema.virtual('employeeCount', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'department',
  count: true
});

module.exports = mongoose.model('Department', departmentSchema);
