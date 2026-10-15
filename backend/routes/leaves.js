const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const store = require('../database/store');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/leaves
// @desc    Get all leave requests (filtered by status or employee)
router.get('/', authenticate, (req, res) => {
  const { status, employeeId } = req.query;

  let leaves = store.getPopulatedLeaves();

  if (status && status !== 'All') {
    leaves = leaves.filter(l => l.status === status);
  }

  if (employeeId) {
    leaves = leaves.filter(l => l.employee && (l.employee.id === employeeId || l.employee._id === employeeId || l.employee.employeeId === employeeId));
  }

  if (req.user.role === 'employee' && req.user.employee) {
    leaves = leaves.filter(l => l.employee && (l.employee.id === req.user.employee.id || l.employee._id === req.user.employee._id));
  }

  // Sort by createdAt descending
  leaves.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = leaves.length;
  if (req.query.page || req.query.limit) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const startIndex = (page - 1) * limit;
    const paginatedData = leaves.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      count: paginatedData.length,
      data: paginatedData
    });
  }

  res.json({
    success: true,
    total,
    count: leaves.length,
    data: leaves
  });
});

// @route   POST /api/leaves
// @desc    Submit new leave request
router.post('/', [
  authenticate,
  body('leaveType').notEmpty().withMessage('Leave type is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { employeeId, leaveType, startDate, endDate, daysCount, reason } = req.body;

  // Validation: Bawal ang baligtad na dates
  if (startDate > endDate) {
    return res.status(400).json({
      success: false,
      message: 'Bawal ang baligtad na dates: Ang Start Date ay hindi maaaring lumampas sa End Date.'
    });
  }

  // Security: Staff members can only submit leave requests for their own profile
  const isUserAdmin = req.user.role === 'admin' || req.user.role === 'manager';
  const myEmpId = req.user.employee ? (req.user.employee.id || req.user.employee._id) : null;
  const targetEmpId = (isUserAdmin && employeeId) ? employeeId : myEmpId;

  if (!targetEmpId) {
    return res.status(400).json({
      success: false,
      message: 'No employee profile associated with this leave request.'
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end - start);
  const calculatedDays = Number(daysCount) || Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;

  // Balance Check: Siguraduhing may sapat pang leave credits si employee bago payagan mag-file
  const employeeRecord = store.employees.find(e => e.id === targetEmpId || e._id === targetEmpId);
  const leaveBalance = employeeRecord?.leaveBalance ?? 15;
  if (calculatedDays > leaveBalance) {
    return res.status(400).json({
      success: false,
      message: `Kulang ang natitirang leave credits (${leaveBalance} days remaining). Hindi pwedeng mag-file ng ${calculatedDays} days.`
    });
  }

  // Overlap Check: Bawal ang duplicate leave application para sa magkakatulad na petsa
  const hasOverlap = store.leaves.some(l => {
    const lEmpId = l.employee?.id || l.employee?._id || l.employee;
    return lEmpId === targetEmpId &&
      l.status !== 'Rejected' &&
      !(endDate < l.startDate || startDate > l.endDate);
  });

  if (hasOverlap) {
    return res.status(400).json({
      success: false,
      message: 'Mayroon ka nang umiiral na leave application para sa mga petsang ito (Pending o Approved).'
    });
  }

  const newId = `leave-${Date.now()}`;
  const newLeave = {
    id: newId,
    _id: newId,
    employee: targetEmpId,
    leaveType,
    startDate,
    endDate,
    daysCount: Number(calculatedDays) || 1,
    reason,
    status: 'Pending',
    reviewedBy: null,
    reviewNotes: '',
    createdAt: new Date()
  };

  store.leaves.push(newLeave);

  // Sync bagong leave sa MongoDB Atlas
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.db.collection('leaves').insertOne(newLeave).catch(() => {});
  }

  const populated = store.getPopulatedLeaves().find(l => l.id === newId);

  res.status(201).json({
    success: true,
    message: 'Leave request submitted successfully and is pending review.',
    data: populated
  });
});

// @route   PUT /api/leaves/:id/status
// @desc    Approve or reject leave request (Admin/Manager)
router.put('/:id/status', [
  authenticate,
  authorize('admin', 'manager'),
  body('status').isIn(['Approved', 'Rejected']).withMessage('Status must be Approved or Rejected'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { status, reviewNotes } = req.body;
  const index = store.leaves.findIndex(l => l.id === req.params.id || l._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Leave request not found' });
  }

  const current = store.leaves[index];
  current.status = status;
  current.reviewedBy = req.user.username;
  current.reviewNotes = reviewNotes || '';

  // Kapag Approved: ibawas sa leave balance at i-sync sa attendance
  if (status === 'Approved') {
    // 1. Bawasan ang leave balance ng empleyado
    const emp = store.employees.find(e => e.id === current.employee || e._id === current.employee);
    if (emp) {
      emp.leaveBalance = Math.max(0, (emp.leaveBalance ?? 15) - (current.daysCount || 1));
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        mongoose.connection.db.collection('employees').updateOne(
          { $or: [{ id: emp.id }, { _id: emp._id }, { employeeId: emp.employeeId }] },
          { $set: { leaveBalance: emp.leaveBalance } }
        ).catch(() => {});
      }
    }

    // 2. I-record ang 'On Leave' sa attendance records
    const start = new Date(current.startDate);
    const end = new Date(current.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const dateStr = d.toISOString().split('T')[0];
      const existingAtt = store.attendance.find(a => a.employee === current.employee && a.date === dateStr);
      let attDoc;
      if (existingAtt) {
        existingAtt.status = 'On Leave';
        existingAtt.notes = `Approved ${current.leaveType}`;
        existingAtt.method = 'System Auto';
        existingAtt.workHours = 0;
        attDoc = existingAtt;
      } else {
        attDoc = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          _id: `att-${Date.now()}`,
          employee: current.employee,
          date: dateStr,
          timeIn: null,
          timeOut: null,
          status: 'On Leave',
          workHours: 0,
          lateMinutes: 0,
          method: 'System Auto',
          notes: `Approved ${current.leaveType}`,
          location: 'Main Office',
          createdAt: new Date()
        };
        store.attendance.push(attDoc);
      }

      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        mongoose.connection.db.collection('attendance').updateOne(
          { $or: [{ id: attDoc.id }, { _id: attDoc._id }] },
          { $set: attDoc },
          { upsert: true }
        ).catch(() => {});
      }
    }
  }

  store.leaves[index] = current;

  // Sync leave decision to MongoDB Atlas
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.db.collection('leaves').updateOne(
      { $or: [{ id: current.id }, { _id: current._id }] },
      { $set: current },
      { upsert: true }
    ).catch(() => {});
  }

  const populated = store.getPopulatedLeaves().find(l => l.id === current.id);

  res.json({
    success: true,
    message: `Leave request has been ${status.toLowerCase()}.`,
    data: populated
  });
});

// @route   DELETE /api/leaves/:id
// @desc    Delete leave request
router.delete('/:id', authenticate, (req, res) => {
  const index = store.leaves.findIndex(l => l.id === req.params.id || l._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Leave request not found' });
  }

  const leave = store.leaves[index];

  if (req.user.role === 'employee') {
    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already processed leave request' });
    }
    const empId = req.user.employee ? (req.user.employee.id || req.user.employee._id) : null;
    if (leave.employee !== empId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
  }

  store.leaves.splice(index, 1);
  res.json({
    success: true,
    message: 'Leave request deleted successfully'
  });
});

module.exports = router;
