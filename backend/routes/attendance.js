const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const store = require('../database/store');
const { authenticate, authorize } = require('../middleware/auth');

const getTodayString = () => {
  const d = new Date();
  const options = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Intl.DateTimeFormat('en-CA', options).format(d);
};

const getCurrentTimeString = () => {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true });
};

const calculateHours = (timeInStr, timeOutStr) => {
  try {
    const parseTime = (str) => {
      const [time, modifier] = str.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    const inMinutes = parseTime(timeInStr);
    const outMinutes = parseTime(timeOutStr);
    const diff = Math.max(0, outMinutes - inMinutes);
    return Number((diff / 60).toFixed(2));
  } catch {
    return 8.0;
  }
};

const checkLate = (timeStr) => {
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const standardStartMinutes = 9 * 60; // 9:00 AM
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > standardStartMinutes + 5) {
      return { isLate: true, lateMinutes: totalMinutes - standardStartMinutes };
    }
    return { isLate: false, lateMinutes: 0 };
  } catch {
    return { isLate: false, lateMinutes: 0 };
  }
};

// @route   GET /api/attendance
// @desc    Get attendance records with filtering, month scoping, and pagination
router.get('/', authenticate, (req, res) => {
  const { date, month, year, startDate, endDate, employeeId, departmentId, status } = req.query;

  let records = store.getPopulatedAttendance();

  // 1. Filter by specific day or month
  if (date) {
    records = records.filter(r => r.date === date);
  } else if (month && month !== 'All') {
    if (month.includes('-')) {
      records = records.filter(r => r.date.startsWith(month));
    } else {
      const m = String(month).padStart(2, '0');
      const y = year || new Date().getFullYear();
      records = records.filter(r => r.date.startsWith(`${y}-${m}`));
    }
  } else if (startDate && endDate) {
    records = records.filter(r => r.date >= startDate && r.date <= endDate);
  }

  // 2. Filter by status
  if (status && status !== 'All') {
    records = records.filter(r => r.status === status);
  }

  // 3. Filter by employee
  if (employeeId) {
    records = records.filter(r => r.employee && (r.employee.id === employeeId || r.employee._id === employeeId || r.employee.employeeId === employeeId));
  }

  // 4. Employee role isolation
  if (req.user.role === 'employee' && req.user.employee) {
    records = records.filter(r => r.employee && (r.employee.id === req.user.employee.id || r.employee._id === req.user.employee._id));
  }

  // 5. Department filter
  if (departmentId && departmentId !== 'All') {
    records = records.filter(r => r.employee && r.employee.department && (r.employee.department.id === departmentId || r.employee.department._id === departmentId || r.employee.department.name === departmentId));
  }

  // Sort descending by date
  records.sort((a, b) => b.date.localeCompare(a.date));

  const total = records.length;

  // Pagination support
  if (req.query.page || req.query.limit) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const startIndex = (page - 1) * limit;
    const paginatedData = records.slice(startIndex, startIndex + limit);

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
    count: records.length,
    data: records
  });
});

// @route   GET /api/attendance/today-summary
// @desc    Get summary counts for today
router.get('/today-summary', authenticate, (req, res) => {
  const today = getTodayString();
  const totalEmployees = store.employees.filter(e => e.status === 'Active').length;
  const todayRecords = store.attendance.filter(r => r.date === today);

  const present = todayRecords.filter(r => r.status === 'Present').length;
  const late = todayRecords.filter(r => r.status === 'Late').length;
  const halfDay = todayRecords.filter(r => r.status === 'Half-Day').length;
  const onLeave = todayRecords.filter(r => r.status === 'On Leave').length;
  const absent = Math.max(0, totalEmployees - (present + late + halfDay + onLeave));

  res.json({
    success: true,
    today,
    metrics: {
      totalEmployees,
      present,
      late,
      halfDay,
      onLeave,
      absent,
      totalCheckedIn: present + late + halfDay
    }
  });
});

// @route   POST /api/attendance/clock-in
// @desc    Clock-in
// @route   POST /api/attendance/clock-in
// @desc    Clock-in for Regular Shift or Overtime (OT) / Extended Duty
router.post('/clock-in', authenticate, (req, res) => {
  const today = getTodayString();
  const nowTime = getCurrentTimeString();
  const { employeeId, notes, method, location, isOvertime } = req.body;

  const targetEmpId = employeeId || (req.user.employee ? (req.user.employee.id || req.user.employee._id) : null);

  if (!targetEmpId) {
    return res.status(400).json({
      success: false,
      message: 'No employee profile linked to clock in.'
    });
  }

  const employee = store.employees.find(e => e.id === targetEmpId || e._id === targetEmpId);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  // Check today's records for this employee
  const todayRecords = store.attendance.filter(a => {
    const aEmp = a.employee?.id || a.employee?._id || a.employee;
    return aEmp === targetEmpId && a.date === today;
  });

  const regularRecord = todayRecords.find(a => a.session !== 'Overtime' && a.status !== 'Overtime');
  const otRecord = todayRecords.find(a => a.session === 'Overtime' || a.status === 'Overtime');

  // Handle Overtime Punch-In (Requires Mandatory Admin Authorization)
  if (isOvertime) {
    if (otRecord && !otRecord.timeOut) {
      return res.status(400).json({
        success: false,
        message: `Already clocked in for Overtime session today at ${otRecord.timeIn}`
      });
    }

    // MANDATORY OVERTIME PERMISSION CHECK:
    // Administrator is inherently authorized; regular employees strictly require Admin authorization
    if (!store.overtimeAuthorizations) {
      store.overtimeAuthorizations = [];
    }

    const isUserAdmin = req.user.role === 'admin';
    const hasAuth = isUserAdmin || store.overtimeAuthorizations.find(a => 
      (a.employee === targetEmpId || a.employeeId === targetEmpId || a.allEmployees === true) &&
      a.date === today &&
      a.status === 'Authorized'
    );

    if (!hasAuth) {
      return res.status(403).json({
        success: false,
        message: 'Bawal mag-Overtime nang walang pahintulot: Overtime duty requires prior official authorization from the Administrator.'
      });
    }

    const newOtRecord = {
      id: `att-ot-${Date.now()}`,
      _id: `att-ot-${Date.now()}`,
      employee: targetEmpId,
      date: today,
      timeIn: nowTime,
      timeOut: null,
      status: 'Overtime',
      session: 'Overtime',
      workHours: 0,
      lateMinutes: 0,
      method: method || 'Authorized Overtime Clock-In',
      notes: notes ? `Authorized Overtime: ${notes}` : `Authorized Overtime Shift (Permitted by ${hasAuth.authorizedBy || 'Admin'})`,
      location: location || 'Main Office',
      createdAt: new Date()
    };
    store.attendance.push(newOtRecord);

    const populated = store.getPopulatedAttendance().find(a => a.id === newOtRecord.id || a._id === newOtRecord.id);
    return res.status(200).json({
      success: true,
      message: `Overtime Shift clocked in successfully at ${nowTime} (Authorized by ${hasAuth.authorizedBy || 'Admin'}).`,
      data: populated
    });
  }

  // Handle Regular Shift Clock-In
  if (regularRecord && regularRecord.timeIn && !regularRecord.timeOut) {
    return res.status(400).json({
      success: false,
      message: `Already clocked in today at ${regularRecord.timeIn}`
    });
  }

  if (regularRecord && regularRecord.timeIn && regularRecord.timeOut) {
    return res.status(400).json({
      success: false,
      message: `Regular shift for today is already completed and saved (${regularRecord.timeIn} - ${regularRecord.timeOut}). Please use "Clock In for Overtime (OT)" for extended duty.`
    });
  }

  const { isLate, lateMinutes } = checkLate(nowTime);
  const initialStatus = isLate ? 'Late' : 'Present';

  let regEntry;
  if (regularRecord) {
    regularRecord.timeIn = nowTime;
    regularRecord.status = initialStatus;
    regularRecord.session = 'Regular';
    regularRecord.lateMinutes = lateMinutes;
    if (notes) regularRecord.notes = notes;
    regEntry = regularRecord;
  } else {
    regEntry = {
      id: `att-${Date.now()}`,
      _id: `att-${Date.now()}`,
      employee: targetEmpId,
      date: today,
      timeIn: nowTime,
      timeOut: null,
      status: initialStatus,
      session: 'Regular',
      workHours: 0,
      lateMinutes,
      method: method || 'Web Clock-In',
      notes: notes || (isLate ? `Clocked in late by ${lateMinutes} minutes` : 'On time'),
      location: location || 'Main Office',
      createdAt: new Date()
    };
    store.attendance.push(regEntry);
  }

  const populated = store.getPopulatedAttendance().find(a => a.id === regEntry.id || a._id === regEntry.id);

  res.status(200).json({
    success: true,
    message: `Clocked in successfully at ${nowTime} (${initialStatus})`,
    data: populated
  });
});

// @route   POST /api/attendance/clock-out
// @desc    Clock-out
router.post('/clock-out', authenticate, (req, res) => {
  const today = getTodayString();
  const nowTime = getCurrentTimeString();
  const { employeeId, notes } = req.body;

  const targetEmpId = employeeId || (req.user.employee ? (req.user.employee.id || req.user.employee._id) : null);

  if (!targetEmpId) {
    return res.status(400).json({
      success: false,
      message: 'No employee profile linked to clock out.'
    });
  }

  const todayRecords = store.attendance.filter(a => {
    const aEmp = a.employee?.id || a.employee?._id || a.employee;
    return aEmp === targetEmpId && a.date === today;
  });

  // Priority 1: If there is an active Overtime session in progress, clock out from Overtime
  const activeOt = todayRecords.find(a => (a.session === 'Overtime' || a.status === 'Overtime') && a.timeIn && !a.timeOut);
  if (activeOt) {
    activeOt.timeOut = nowTime;
    const hours = calculateHours(activeOt.timeIn, nowTime);
    activeOt.workHours = hours;
    activeOt.status = 'Overtime';
    activeOt.notes = (activeOt.notes ? activeOt.notes + ' | ' : '') + `Overtime completed: ${hours} hrs (${nowTime})` + (notes ? ` | ${notes}` : '');

    const populated = store.getPopulatedAttendance().find(a => a.id === activeOt.id || a._id === activeOt.id);
    return res.json({
      success: true,
      message: `Clocked out from Overtime successfully at ${nowTime}. Total OT: ${hours} hrs logged.`,
      data: populated
    });
  }

  // Priority 2: Clock out from regular shift
  const regularRecord = todayRecords.find(a => a.session !== 'Overtime' && a.status !== 'Overtime');

  if (!regularRecord || !regularRecord.timeIn) {
    return res.status(400).json({
      success: false,
      message: 'Cannot clock out: No active clock-in record found for today.'
    });
  }

  if (regularRecord.timeOut) {
    return res.status(400).json({
      success: false,
      message: `Regular shift already clocked out today at ${regularRecord.timeOut}. Use "Clock In for Overtime (OT)" for additional duty.`
    });
  }

  regularRecord.timeOut = nowTime;
  const hours = calculateHours(regularRecord.timeIn, nowTime);
  regularRecord.workHours = hours;

  // Evaluate status according to hours worked
  if (hours < 1.0) {
    regularRecord.status = 'Incomplete Shift';
    const mins = Math.max(1, Math.round(hours * 60));
    regularRecord.notes = `Incomplete punch (${mins}m worked). Below minimum threshold (<1 hr). Not credited.` + (notes ? ` | ${notes}` : '');
  } else if (hours < 4.0) {
    regularRecord.status = 'Undertime';
    regularRecord.notes = `Undertime shift (${hours} hrs worked). Insufficient for half-day (<4 hrs).` + (notes ? ` | ${notes}` : '');
  } else if (hours < 7.5) {
    regularRecord.status = 'Half-Day';
    regularRecord.notes = `Half-Day shift credited (${hours} hrs worked).` + (notes ? ` | ${notes}` : '');
  } else {
    // 7.5+ hours -> Full Day
    if (regularRecord.status !== 'Late') {
      regularRecord.status = 'Present';
    }
    if (notes) regularRecord.notes = regularRecord.notes ? `${regularRecord.notes} | ${notes}` : (regularRecord.notes || 'Full day shift completed');
  }

  const populated = store.getPopulatedAttendance().find(a => a.id === regularRecord.id || a._id === regularRecord.id);

  res.json({
    success: true,
    message: `Clocked out successfully at ${nowTime}. Total hours: ${regularRecord.workHours} hrs (${regularRecord.status}). Shift saved to timeline.`,
    data: populated
  });
});

// @route   POST /api/attendance/reset-today
// @desc    Administrative reset of today's punch for testing and verification
router.post('/reset-today', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted: Only system administrators may perform punch resets.'
    });
  }

  const today = getTodayString();
  const targetEmpId = req.body.employeeId || (req.user.employee ? (req.user.employee.id || req.user.employee._id) : null);

  if (!targetEmpId) {
    return res.status(400).json({
      success: false,
      message: 'No employee linked to reset.'
    });
  }

  // Remove today's record from store
  store.attendance = store.attendance.filter(a => {
    const aEmp = a.employee?.id || a.employee?._id || a.employee;
    return !(aEmp === targetEmpId && a.date === today);
  });

  res.json({
    success: true,
    message: "Today's shift record reset successfully. Ready for Time-In."
  });
});

// @route   POST /api/attendance/manual
// @desc    Admin/HR manual attendance entry
router.post('/manual', [
  authenticate,
  authorize('admin', 'manager'),
  body('employee').notEmpty().withMessage('Employee is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('status').isIn(['Present', 'Late', 'Absent', 'Half-Day', 'On Leave']).withMessage('Invalid status'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { employee, date, timeIn, timeOut, status, notes, workHours, lateMinutes } = req.body;

  const existing = store.attendance.find(a => a.employee === employee && a.date === date);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An attendance record already exists for this employee on this date.'
    });
  }

  let computedHours = workHours;
  if (timeIn && timeOut && !computedHours) {
    computedHours = calculateHours(timeIn, timeOut);
  }

  const newRecord = {
    id: `att-${Date.now()}`,
    _id: `att-${Date.now()}`,
    employee,
    date,
    timeIn: timeIn || null,
    timeOut: timeOut || null,
    status,
    workHours: Number(computedHours) || 0,
    lateMinutes: Number(lateMinutes) || 0,
    method: 'Admin Manual',
    notes: notes || 'Manually logged by HR',
    location: 'Main Office',
    createdAt: new Date()
  };

  store.attendance.push(newRecord);
  const populated = store.getPopulatedAttendance().find(a => a.id === newRecord.id);

  res.status(201).json({
    success: true,
    message: 'Attendance record created successfully',
    data: populated
  });
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (Admin/Manager)
router.put('/:id', [authenticate, authorize('admin', 'manager')], (req, res) => {
  const index = store.attendance.findIndex(a => a.id === req.params.id || a._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Attendance record not found' });
  }

  const current = store.attendance[index];
  const { timeIn, timeOut, status, notes, workHours, lateMinutes } = req.body;

  if (timeIn !== undefined) current.timeIn = timeIn;
  if (timeOut !== undefined) current.timeOut = timeOut;
  if (status) current.status = status;
  if (notes !== undefined) current.notes = notes;
  if (lateMinutes !== undefined) current.lateMinutes = Number(lateMinutes);

  if (timeIn && timeOut) {
    current.workHours = workHours !== undefined ? Number(workHours) : calculateHours(timeIn, timeOut);
  } else if (workHours !== undefined) {
    current.workHours = Number(workHours);
  }

  store.attendance[index] = current;
  const populated = store.getPopulatedAttendance().find(a => a.id === current.id);

  res.json({
    success: true,
    message: 'Attendance record updated successfully',
    data: populated
  });
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record (Admin)
router.delete('/:id', [authenticate, authorize('admin')], (req, res) => {
  const index = store.attendance.findIndex(a => a.id === req.params.id || a._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Attendance record not found' });
  }

  store.attendance.splice(index, 1);
  res.json({
    success: true,
    message: 'Attendance record deleted successfully'
  });
});

// ==========================================
// ATTENDANCE ADJUSTMENT / CORRECTION ROUTES
// ==========================================

// @route   GET /api/attendance/adjustments
// @desc    Get attendance adjustment requests
router.get('/adjustments', authenticate, (req, res) => {
  const { status } = req.query;
  let list = store.getPopulatedAdjustments();

  if (status && status !== 'All') {
    list = list.filter(a => a.status === status);
  }

  if (req.user.role === 'employee' && req.user.employee) {
    const empId = req.user.employee.id || req.user.employee._id;
    list = list.filter(a => a.employee && (a.employee.id === empId || a.employee._id === empId));
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    count: list.length,
    data: list
  });
});

// @route   POST /api/attendance/adjustments
// @desc    Submit an attendance adjustment request (e.g. forgot clock-in/out, system issue)
router.post('/adjustments', [
  authenticate,
  body('date').notEmpty().withMessage('Attendance date is required'),
  body('requestedTimeIn').notEmpty().withMessage('Requested Time-In is required'),
  body('requestedTimeOut').notEmpty().withMessage('Requested Time-Out is required'),
  body('reason').notEmpty().withMessage('Reason for adjustment is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { date, requestedTimeIn, requestedTimeOut, reason, employeeId } = req.body;
  const targetEmpId = employeeId || (req.user.employee ? (req.user.employee.id || req.user.employee._id) : null);

  if (!targetEmpId) {
    return res.status(400).json({
      success: false,
      message: 'No employee linked to submit adjustment request.'
    });
  }

  const newAdj = {
    id: `adj-${Date.now()}`,
    _id: `adj-${Date.now()}`,
    employee: targetEmpId,
    date,
    requestedTimeIn,
    requestedTimeOut,
    reason,
    status: 'Pending',
    reviewedBy: null,
    reviewNotes: '',
    createdAt: new Date()
  };

  store.adjustments.push(newAdj);
  const populated = store.getPopulatedAdjustments().find(a => a.id === newAdj.id);

  res.status(201).json({
    success: true,
    message: 'Attendance adjustment request filed successfully and submitted to HR for approval.',
    data: populated
  });
});

// @route   PUT /api/attendance/adjustments/:id/review
// @desc    Admin review (Approve / Reject) attendance adjustment request
router.put('/adjustments/:id/review', [authenticate, authorize('admin', 'manager')], (req, res) => {
  const { status, reviewNotes } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Approved or Rejected.' });
  }

  const adj = store.adjustments.find(a => a.id === req.params.id || a._id === req.params.id);
  if (!adj) {
    return res.status(404).json({ success: false, message: 'Adjustment request not found.' });
  }

  adj.status = status;
  adj.reviewNotes = reviewNotes || (status === 'Approved' ? 'Approved by HR Administrator.' : 'Unable to verify adjustment request.');
  adj.reviewedBy = req.user.username;
  adj.reviewedAt = new Date();

  // If approved, synchronize and update or create attendance record!
  if (status === 'Approved') {
    const hours = calculateHours(adj.requestedTimeIn, adj.requestedTimeOut);
    const lateCheck = checkLate(adj.requestedTimeIn);

    let att = store.attendance.find(a => {
      const aEmp = a.employee?.id || a.employee?._id || a.employee;
      return aEmp === adj.employee && a.date === adj.date;
    });

    if (att) {
      att.timeIn = adj.requestedTimeIn;
      att.timeOut = adj.requestedTimeOut;
      att.workHours = hours;
      att.status = lateCheck.isLate ? 'Late' : 'Present';
      att.lateMinutes = lateCheck.lateMinutes;
      att.method = 'Manual Adjustment';
      att.notes = `Adjusted via HR Approval: ${adj.reason}`;
    } else {
      const newAtt = {
        id: `att-${Date.now()}`,
        _id: `att-${Date.now()}`,
        employee: adj.employee,
        date: adj.date,
        timeIn: adj.requestedTimeIn,
        timeOut: adj.requestedTimeOut,
        status: lateCheck.isLate ? 'Late' : 'Present',
        workHours: hours,
        lateMinutes: lateCheck.lateMinutes,
        method: 'Manual Adjustment',
        notes: `Adjusted via HR Approval: ${adj.reason}`,
        location: 'Main Office',
        createdAt: new Date()
      };
      store.attendance.push(newAtt);
    }
  }

  const populated = store.getPopulatedAdjustments().find(a => a.id === adj.id);

  res.json({
    success: true,
    message: `Attendance adjustment ${status.toLowerCase()} successfully.`,
    data: populated
  });
});

// @route   DELETE /api/attendance/adjustments/:id
// @desc    Cancel or delete an adjustment request
router.delete('/adjustments/:id', authenticate, (req, res) => {
  const index = store.adjustments.findIndex(a => a.id === req.params.id || a._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Adjustment request not found' });
  }

  const adj = store.adjustments[index];
  if (req.user.role !== 'admin' && adj.status !== 'Pending') {
    return res.status(403).json({ success: false, message: 'Cannot cancel an adjustment that has already been processed.' });
  }

  store.adjustments.splice(index, 1);

  res.json({
    success: true,
    message: 'Attendance adjustment request cancelled successfully.'
  });
});

// ==========================================
// OVERTIME AUTHORIZATIONS & MANDATES (ADMIN)
// ==========================================

// @route   GET /api/attendance/overtime-authorizations
// @desc    Get overtime authorizations for a given date or employee
router.get('/overtime-authorizations', authenticate, (req, res) => {
  const { date, employeeId } = req.query;
  const today = date || getTodayString();

  if (!store.overtimeAuthorizations) {
    store.overtimeAuthorizations = [];
  }

  let list = store.getPopulatedOvertimeAuthorizations();

  if (today) {
    list = list.filter(a => a.date === today);
  }

  if (employeeId) {
    list = list.filter(a => {
      const eId = a.employee?.id || a.employee?._id || a.employee;
      return eId === employeeId || a.allEmployees === true;
    });
  }

  // If non-admin, only show their own
  if (req.user.role !== 'admin') {
    const myEmpId = req.user.employee ? (req.user.employee.id || req.user.employee._id) : null;
    list = list.filter(a => {
      const eId = a.employee?.id || a.employee?._id || a.employee;
      return eId === myEmpId || a.allEmployees === true;
    });
  }

  res.json({
    success: true,
    data: list
  });
});

// @route   POST /api/attendance/overtime-authorizations
// @desc    Admin authorizes/mandates overtime for employee(s)
router.post('/overtime-authorizations', [authenticate, authorize('admin', 'manager')], (req, res) => {
  const { employeeId, date, reason, maxHours, allEmployees } = req.body;
  const today = date || getTodayString();

  if (!allEmployees && !employeeId) {
    return res.status(400).json({
      success: false,
      message: 'Please specify employee to authorize for overtime.'
    });
  }

  if (!store.overtimeAuthorizations) {
    store.overtimeAuthorizations = [];
  }

  // Check if already authorized
  const existing = store.overtimeAuthorizations.find(a => 
    (allEmployees ? a.allEmployees : (a.employee === employeeId || a.employeeId === employeeId)) &&
    a.date === today &&
    a.status === 'Authorized'
  );

  if (existing) {
    return res.status(400).json({
      success: false,
      message: allEmployees 
        ? 'Overtime authorization is already active for the entire workforce today.' 
        : 'Overtime authorization is already active for this employee today.'
    });
  }

  const adminName = req.user.employee 
    ? `${req.user.employee.firstName} ${req.user.employee.lastName} (Admin)`
    : `${req.user.username} (Admin)`;

  const newAuth = {
    id: `ot-auth-${Date.now()}`,
    _id: `ot-auth-${Date.now()}`,
    employee: allEmployees ? null : employeeId,
    allEmployees: Boolean(allEmployees),
    date: today,
    authorizedBy: adminName,
    reason: reason || 'Approved Operational Duty / Production Deployment',
    maxHours: Number(maxHours) || 4,
    status: 'Authorized',
    createdAt: new Date()
  };

  store.overtimeAuthorizations.push(newAuth);
  const populated = store.getPopulatedOvertimeAuthorizations().find(a => a.id === newAuth.id);

  res.status(201).json({
    success: true,
    message: allEmployees 
      ? `Overtime mandated and authorized for all employees for ${today}.`
      : `Overtime duty authorized successfully for ${today}.`,
    data: populated
  });
});

// @route   DELETE /api/attendance/overtime-authorizations/:id
// @desc    Admin revokes an overtime authorization
router.delete('/overtime-authorizations/:id', [authenticate, authorize('admin', 'manager')], (req, res) => {
  if (!store.overtimeAuthorizations) {
    store.overtimeAuthorizations = [];
  }

  const index = store.overtimeAuthorizations.findIndex(a => a.id === req.params.id || a._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Authorization record not found' });
  }

  store.overtimeAuthorizations.splice(index, 1);

  res.json({
    success: true,
    message: 'Overtime authorization revoked successfully.'
  });
});

module.exports = router;
