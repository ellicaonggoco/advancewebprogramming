const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const store = require('../database/store');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/employees
// @desc    Get all employees with search and department filtering
router.get('/', authenticate, (req, res) => {
  const { search, department, status, sort = 'lastName' } = req.query;

  let employees = store.getPopulatedEmployees();

  if (department && department !== 'All') {
    employees = employees.filter(e => e.department && (e.department.id === department || e.department._id === department || e.department.name === department));
  }

  if (status && status !== 'All') {
    employees = employees.filter(e => e.status === status);
  }

  if (search) {
    const s = search.toLowerCase().trim();
    employees = employees.filter(e =>
      e.firstName.toLowerCase().includes(s) ||
      e.lastName.toLowerCase().includes(s) ||
      e.employeeId.toLowerCase().includes(s) ||
      e.email.toLowerCase().includes(s) ||
      e.position.toLowerCase().includes(s)
    );
  }

  // Sorting
  employees.sort((a, b) => {
    return a.lastName.localeCompare(b.lastName);
  });

  const total = employees.length;
  if (req.query.page || req.query.limit) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const startIndex = (page - 1) * limit;
    const paginatedData = employees.slice(startIndex, startIndex + limit);

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
    count: employees.length,
    data: employees
  });
});

// @route   GET /api/employees/:id
// @desc    Get single employee details + recent attendance
router.get('/:id', authenticate, (req, res) => {
  const employees = store.getPopulatedEmployees();
  const employee = employees.find(e => e.id === req.params.id || e._id === req.params.id);

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const attendance = store.attendance.filter(a => a.employee === employee.id || a.employee === employee._id);
  const leaves = store.leaves.filter(l => l.employee === employee.id || l.employee === employee._id);

  res.json({
    success: true,
    data: employee,
    recentAttendance: attendance.slice(-30).reverse(),
    leaves: leaves.reverse()
  });
});

const bcrypt = require('bcryptjs');

// @route   POST /api/employees
// @desc    Create new employee (Admin/Manager)
router.post('/', [
  authenticate,
  authorize('admin', 'manager'),
  body('employeeId').optional().trim(),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('salary').isNumeric().withMessage('Valid salary is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    employeeId, firstName, lastName, email, phone,
    department, position, hireDate, salary, status, shift, avatar,
    createAccount, username, password
  } = req.body;

  let finalEmpId = employeeId && employeeId.trim();
  if (!finalEmpId) {
    let maxNum = 1000;
    store.employees.forEach(e => {
      if (e.employeeId) {
        const match = e.employeeId.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
    });
    finalEmpId = `EMP-${maxNum + 1}`;
  }

  const existing = store.employees.find(
    e => e.employeeId.toLowerCase() === finalEmpId.toLowerCase() || e.email.toLowerCase() === email.toLowerCase()
  );

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'An employee with this Employee ID or Email already exists.'
    });
  }

  // If user login account requested
  let newUser = null;
  if (createAccount && username && password) {
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existingUser = store.users.find(
      u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === email.toLowerCase()
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `An account with username "${cleanUsername}" or email "${email}" already exists.`
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUserId = `user-${Date.now()}`;
    newUser = {
      id: newUserId,
      _id: newUserId,
      username: cleanUsername,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'employee',
      employee: null,
      status: 'active',
      createdAt: new Date()
    };
  }

  const newId = `emp-${Date.now()}`;
  const newEmp = {
    id: newId,
    _id: newId,
    employeeId: finalEmpId,
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    department,
    position,
    hireDate: hireDate || new Date().toISOString().split('T')[0],
    salary: Number(salary),
    status: 'Active',
    shift: shift || 'Standard (9:00 AM - 5:00 PM)',
    avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}%20${lastName}`,
    createdAt: new Date()
  };

  store.employees.push(newEmp);

  if (newUser) {
    newUser.employee = newId;
    store.users.push(newUser);
  }

  // Sync to MongoDB Atlas if connected
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) {
    const db = mongoose.connection.db;
    await db.collection('employees').insertOne(newEmp).catch(() => {});
    if (newUser) {
      await db.collection('users').insertOne(newUser).catch(() => {});
    }
  }

  const dept = store.departments.find(d => d.id === department || d._id === department);
  const populated = {
    ...newEmp,
    department: dept ? { _id: dept.id, id: dept.id, name: dept.name, code: dept.code } : null,
    fullName: `${firstName} ${lastName}`,
    userAccount: newUser ? { username: newUser.username, role: newUser.role } : null
  };

  res.status(201).json({
    success: true,
    message: newUser 
      ? `Employee ${finalEmpId} and portal login account (@${newUser.username}) created successfully.`
      : `Employee ${finalEmpId} created successfully.`,
    data: populated
  });
});

// @route   PUT /api/employees/:id
// @desc    Update employee details
router.put('/:id', [
  authenticate,
  authorize('admin', 'manager'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const index = store.employees.findIndex(e => e.id === req.params.id || e._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const current = store.employees[index];
  Object.assign(current, req.body);
  if (req.body.salary !== undefined) current.salary = Number(req.body.salary);
  store.employees[index] = current;

  if (req.body.email) {
    const linkedUser = store.users.find(u => u.employee === current.id || u.employee === current._id);
    if (linkedUser) {
      linkedUser.email = req.body.email.toLowerCase().trim();
    }
  }

  const dept = store.departments.find(d => d.id === current.department || d._id === current.department);
  const populated = {
    ...current,
    department: dept ? { _id: dept.id, id: dept.id, name: dept.name, code: dept.code } : null,
    fullName: `${current.firstName} ${current.lastName}`
  };

  res.json({
    success: true,
    message: 'Employee updated successfully',
    data: populated
  });
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee (Admin)
router.delete('/:id', [authenticate, authorize('admin')], (req, res) => {
  const empId = req.params.id;
  const index = store.employees.findIndex(e => e.id === empId || e._id === empId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  store.employees.splice(index, 1);
  // Clean up associated attendance & leaves
  store.attendance = store.attendance.filter(a => a.employee !== empId);
  store.leaves = store.leaves.filter(l => l.employee !== empId);

  res.json({
    success: true,
    message: 'Employee and associated records deleted successfully'
  });
});

module.exports = router;
