const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const store = require('../database/store');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/departments
// @desc    Get all departments with employee counts
router.get('/', authenticate, (req, res) => {
  const departmentsWithCounts = store.departments.map(dept => {
    const count = store.employees.filter(e => (e.department === dept.id || e.department === dept._id)).length;
    return {
      ...dept,
      employeeCount: count
    };
  });

  res.json({
    success: true,
    count: departmentsWithCounts.length,
    data: departmentsWithCounts
  });
});

// @route   GET /api/departments/:id
// @desc    Get single department by ID
router.get('/:id', authenticate, (req, res) => {
  const dept = store.departments.find(d => d.id === req.params.id || d._id === req.params.id);
  if (!dept) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const deptEmployees = store.getPopulatedEmployees().filter(
    e => e.department && (e.department.id === req.params.id || e.department._id === req.params.id)
  );

  res.json({
    success: true,
    data: dept,
    employees: deptEmployees
  });
});

// @route   POST /api/departments
// @desc    Create a new department (Admin/Manager)
router.post('/', [
  authenticate,
  authorize('admin', 'manager'),
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('code').trim().notEmpty().withMessage('Department code is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, code, description, managerName, budget } = req.body;
  const upperCode = code.toUpperCase();

  const existing = store.departments.find(
    d => d.name.toLowerCase() === name.toLowerCase() || d.code === upperCode
  );

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'A department with this name or code already exists'
    });
  }

  const newId = `dept-${Date.now()}`;
  const newDept = {
    id: newId,
    _id: newId,
    name,
    code: upperCode,
    description: description || '',
    managerName: managerName || 'Unassigned',
    budget: Number(budget) || 0,
    createdAt: new Date()
  };

  store.departments.push(newDept);

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: newDept
  });
});

// @route   PUT /api/departments/:id
// @desc    Update department (Admin/Manager)
router.put('/:id', [
  authenticate,
  authorize('admin', 'manager'),
  body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
  body('code').optional().trim().notEmpty().withMessage('Department code cannot be empty'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const index = store.departments.findIndex(d => d.id === req.params.id || d._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const { name, code, description, managerName, budget } = req.body;
  const current = store.departments[index];

  if (name) current.name = name;
  if (code) current.code = code.toUpperCase();
  if (description !== undefined) current.description = description;
  if (managerName !== undefined) current.managerName = managerName;
  if (budget !== undefined) current.budget = Number(budget);

  store.departments[index] = current;

  res.json({
    success: true,
    message: 'Department updated successfully',
    data: current
  });
});

// @route   DELETE /api/departments/:id
// @desc    Delete department (Admin)
router.delete('/:id', [authenticate, authorize('admin')], (req, res) => {
  const deptId = req.params.id;
  const employeeCount = store.employees.filter(e => e.department === deptId).length;

  if (employeeCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete department: ${employeeCount} employee(s) are assigned to it. Reassign employees first.`
    });
  }

  const index = store.departments.findIndex(d => d.id === deptId || d._id === deptId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  store.departments.splice(index, 1);

  res.json({
    success: true,
    message: 'Department deleted successfully'
  });
});

module.exports = router;
