const express = require('express');
const router = express.Router();
const store = require('../database/store');
const { authenticate } = require('../middleware/auth');

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const parseTimeToMinutes = (str) => {
  if (!str) return 0;
  try {
    const [time, modifier] = str.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } catch {
    return 0;
  }
};

// Kinukwenta yung tamang rendered hours ng attendance record:
// - Kapag 'On Leave', 0 hours ang credited (leave credit ang ibabawas)
// - Kapag may workHours na naka-record (naka-clock out na), yun ang gagamitin
// - Kapag may time-in at time-out, compute yung minutes difference divided by 60
// - Kapag kasalukuyang naka-duty pa (time-in pero wala pang time-out), i-estimate ang shift hours minus late minutes
const calculateRecordHours = (r) => {
  if (!r || r.status === 'On Leave') return 0;
  if (r.workHours && r.workHours > 0) return r.workHours;
  if (r.timeIn && r.timeOut) {
    const inMin = parseTimeToMinutes(r.timeIn);
    const outMin = parseTimeToMinutes(r.timeOut);
    return Number((Math.max(0, outMin - inMin) / 60).toFixed(2));
  }
  if (r.timeIn && !r.timeOut) {
    const lateDed = (r.lateMinutes || 0) / 60;
    return Math.max(1.0, Number((8.25 - lateDed).toFixed(2)));
  }
  return 0;
};

// @route   GET /api/reports/dashboard-stats
// @desc    Comprehensive dashboard KPI stats
router.get('/dashboard-stats', authenticate, (req, res) => {
  const today = getTodayString();
  const totalEmployees = store.employees.length;
  const activeEmployees = store.employees.filter(e => e.status === 'Active').length;
  const totalDepartments = store.departments.length;
  const pendingLeaves = store.leaves.filter(l => l.status === 'Pending').length;

  const todayAttendance = store.getPopulatedAttendance().filter(r => r.date === today);
  const presentCount = todayAttendance.filter(r => r.status === 'Present').length;
  const lateCount = todayAttendance.filter(r => r.status === 'Late').length;
  const halfDayCount = todayAttendance.filter(r => r.status === 'Half-Day').length;
  const onLeaveCount = todayAttendance.filter(r => r.status === 'On Leave').length;
  const absentCount = Math.max(0, activeEmployees - (presentCount + lateCount + halfDayCount + onLeaveCount));

  const attendanceRate = activeEmployees > 0 
    ? Math.round(((presentCount + lateCount + halfDayCount) / activeEmployees) * 100)
    : 0;

  // Recent clock-in events
  let recentActivity = todayAttendance
    .filter(r => r.timeIn)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // If worker/employee, isolate their personal recent activity
  if (req.user.role === 'employee' && req.user.employee) {
    const empId = req.user.employee.id || req.user.employee._id;
    recentActivity = store.getPopulatedAttendance()
      .filter(r => r.employee && (r.employee.id === empId || r.employee._id === empId))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  } else {
    recentActivity = recentActivity.slice(0, 5);
  }

  // Employee personal summary if employee
  let employeeStats = null;
  if (req.user.role === 'employee' && req.user.employee) {
    const empId = req.user.employee.id || req.user.employee._id;
    const currentMonth = today.slice(0, 7);
    const empAttendance = store.attendance.filter(r => r.employee === empId || (r.employee && (r.employee.id === empId || r.employee._id === empId)));
    const monthLogs = empAttendance.filter(r => (r.date || '').startsWith(currentMonth));
    const empLeaves = store.leaves.filter(l => l.employee === empId || (l.employee && (l.employee.id === empId || l.employee._id === empId)));

    const presentDays = monthLogs.filter(r => r.status === 'Present').length;
    const lateDays = monthLogs.filter(r => r.status === 'Late').length;
    const halfDays = monthLogs.filter(r => r.status === 'Half-Day').length;
    const onLeaveDays = monthLogs.filter(r => r.status === 'On Leave').length;
    // Total days employee showed up to work: on-time days + late days + half-days
    const daysWorked = presentDays + lateDays + halfDays;
    const totalWorkingLogs = monthLogs.length;
    const onTimeRate = daysWorked > 0 ? Math.round((presentDays / daysWorked) * 100) : 100;

    const myEmp = store.employees.find(e => e.id === empId || e._id === empId);

    employeeStats = {
      shift: myEmp?.shift || '09:00 AM - 06:00 PM',
      leaveBalance: myEmp?.leaveBalance ?? 15,
      daysWorked,
      totalPresentDays: daysWorked,
      presentDays,
      lateDays,
      halfDays,
      onLeaveDays,
      totalWorkingLogs,
      onTimeRate,
      pendingLeaves: empLeaves.filter(l => l.status === 'Pending').length,
      approvedLeaves: empLeaves.filter(l => l.status === 'Approved').length
    };
  }

  // Department distribution
  const departmentStats = store.departments.map(dept => {
    const count = store.employees.filter(e => e.department === dept.id || e.department === dept._id).length;
    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      employeeCount: count
    };
  });

  res.json({
    success: true,
    stats: {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      pendingLeaves,
      today: {
        date: today,
        present: presentCount,
        late: lateCount,
        halfDay: halfDayCount,
        onLeave: onLeaveCount,
        absent: absentCount,
        attendanceRate
      },
      departmentStats,
      recentActivity,
      employeeStats
    }
  });
});

// @route   GET /api/reports/monthly-summary
// @desc    REPORT 1: Detailed Monthly Attendance Summary per Employee
router.get('/monthly-summary', authenticate, (req, res) => {
  const { month, year, departmentId } = req.query;

  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  let employees = store.getPopulatedEmployees().filter(e => e.status === 'Active');
  if (departmentId && departmentId !== 'All') {
    employees = employees.filter(e => e.department && (e.department.id === departmentId || e.department._id === departmentId || e.department.name === departmentId));
  }

  const attendanceRecords = store.attendance.filter(r => r.date.startsWith(monthPrefix));

  const reportData = employees.map(emp => {
    const records = attendanceRecords.filter(r => r.employee === emp.id || r.employee === emp._id);
    const presentDays = records.filter(r => r.status === 'Present').length;
    const lateDays = records.filter(r => r.status === 'Late').length;
    const halfDays = records.filter(r => r.status === 'Half-Day').length;
    const onLeaveDays = records.filter(r => r.status === 'On Leave').length;
    const totalHours = records.reduce((sum, r) => sum + calculateRecordHours(r), 0);
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
    const daysWorked = presentDays + lateDays + halfDays;

    const expectedWorkDays = 22;
    const complianceRate = Math.min(100, Math.round((daysWorked / expectedWorkDays) * 100));

    return {
      employeeId: emp.employeeId,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department ? emp.department.name : 'N/A',
      position: emp.position,
      presentDays,
      lateDays,
      halfDays,
      onLeaveDays,
      daysWorked,
      totalHours: Number(totalHours.toFixed(1)),
      totalLateMinutes,
      complianceRate
    };
  });

  res.json({
    success: true,
    period: { month: currentMonth, year: currentYear },
    count: reportData.length,
    data: reportData
  });
});

// @route   GET /api/reports/department-analytics
// @desc    REPORT 2: Department-wide Attendance and Leave Analytics
router.get('/department-analytics', authenticate, (req, res) => {
  const { month, year, departmentId } = req.query;

  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? String(month).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonth}`;

  let departments = store.departments;
  if (departmentId && departmentId !== 'All') {
    departments = departments.filter(d => d.id === departmentId || d._id === departmentId || d.name === departmentId);
  }

  const employees = store.employees.filter(e => e.status === 'Active');
  const attendanceRecords = store.attendance.filter(a => a.date.startsWith(monthPrefix));
  const leaveRequests = store.leaves;

  const departmentReports = departments.map(dept => {
    const deptEmployees = employees.filter(e => e.department === dept.id || e.department === dept._id);
    const deptEmpIds = deptEmployees.map(e => e.id);

    const deptAttendance = attendanceRecords.filter(a => deptEmpIds.includes(a.employee));
    const totalHours = deptAttendance.reduce((sum, a) => sum + calculateRecordHours(a), 0);
    const presentCount = deptAttendance.filter(a => a.status === 'Present').length;
    const lateCount = deptAttendance.filter(a => a.status === 'Late').length;

    const deptLeaves = leaveRequests.filter(l => deptEmpIds.includes(l.employee));
    const approvedLeaves = deptLeaves.filter(l => l.status === 'Approved').length;
    const pendingLeaves = deptLeaves.filter(l => l.status === 'Pending').length;

    const totalRecorded = deptAttendance.length;
    const punctualityRate = totalRecorded > 0
      ? Math.round((presentCount / totalRecorded) * 100)
      : 100;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      departmentCode: dept.code,
      managerName: dept.managerName,
      totalEmployees: deptEmployees.length,
      totalHoursWorked: Number(totalHours.toFixed(1)),
      punctualityRate,
      approvedLeaves,
      pendingLeaves
    };
  });

  res.json({
    success: true,
    period: { month: currentMonth, year: currentYear },
    currentMonth: monthPrefix,
    data: departmentReports
  });
});

module.exports = router;
