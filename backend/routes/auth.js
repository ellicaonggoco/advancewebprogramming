const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const store = require('../database/store');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user account
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, role, employeeId } = req.body;

    const existingUser = store.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with that email or username already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newId = `user-${Date.now()}`;

    const newUser = {
      id: newId,
      _id: newId,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'employee',
      employee: employeeId || null,
      status: 'active',
      createdAt: new Date()
    };

    store.users.push(newUser);

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    const employees = store.getPopulatedEmployees();
    const linkedEmp = employees.find(e => e.id === employeeId || e._id === employeeId);
    const finalAvatar = newUser.avatar || linkedEmp?.avatar || '';

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        avatar: finalAvatar,
        employee: linkedEmp ? { ...linkedEmp, avatar: finalAvatar } : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
router.post('/login', [
  body('usernameOrEmail').trim().notEmpty().withMessage('Username or Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { usernameOrEmail, password } = req.body;
    const searchTarget = usernameOrEmail.toLowerCase();

    const user = store.users.find(
      u => u.email.toLowerCase() === searchTarget || u.username.toLowerCase() === searchTarget
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact your administrator.'
      });
    }

    // Sync latest avatar from MongoDB if connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      try {
        const db = mongoose.connection.db;
        const dbUser = await db.collection('users').findOne({
          $or: [
            { username: user.username },
            { email: user.email },
            { id: user.id || user._id }
          ]
        });
        if (dbUser && dbUser.avatar) {
          user.avatar = dbUser.avatar;
        }
        if (user.employee) {
          const dbEmp = await db.collection('employees').findOne({
            $or: [
              { id: user.employee },
              { _id: user.employee }
            ]
          });
          if (dbEmp && dbEmp.avatar) {
            const empInStore = store.employees.find(e => e.id === user.employee || e._id === user.employee);
            if (empInStore) empInStore.avatar = dbEmp.avatar;
          }
        }
      } catch (syncErr) {
        // non-blocking
      }
    }

    const token = jwt.sign({ id: user.id || user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const employees = store.getPopulatedEmployees();
    const linkedEmp = employees.find(e => e.id === user.employee || e._id === user.employee);
    const finalAvatar = user.avatar || linkedEmp?.avatar || '';

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: finalAvatar,
        employee: linkedEmp ? {
          ...linkedEmp,
          avatar: finalAvatar
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/auth/me
// @desc    Get currently logged in user profile
router.get('/me', authenticate, (req, res) => {
  const employees = store.getPopulatedEmployees();
  const linkedEmp = employees.find(e => 
    e.id === req.user.employee?.id || 
    e._id === req.user.employee?._id || 
    e.id === req.user.employee || 
    e._id === req.user.employee
  );
  const finalAvatar = req.user.avatar || linkedEmp?.avatar || '';

  res.json({
    success: true,
    user: {
      ...req.user,
      avatar: finalAvatar,
      employee: linkedEmp ? { ...linkedEmp, avatar: finalAvatar } : req.user.employee
    }
  });
});

// @route   POST /api/auth/forgot-password
// @desc    Verify user identity for password reset
router.post('/forgot-password', [
  body('emailOrUsername').trim().notEmpty().withMessage('Email or username is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { emailOrUsername } = req.body;
    const target = emailOrUsername.toLowerCase().trim();

    const user = store.users.find(
      u => u.email.toLowerCase() === target || u.username.toLowerCase() === target
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered institutional account found for that email or username.'
      });
    }

    res.json({
      success: true,
      message: 'Account verified successfully.',
      email: user.email,
      username: user.username
    });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/auth/reset-password
// @desc    Update user password
router.post('/reset-password', [
  body('emailOrUsername').trim().notEmpty().withMessage('Email or username is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { emailOrUsername, newPassword } = req.body;
    const target = emailOrUsername.toLowerCase().trim();

    const user = store.users.find(
      u => u.email.toLowerCase() === target || u.username.toLowerCase() === target
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    // Sync to MongoDB Atlas if connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.collection('users').updateOne(
        { $or: [{ id: user.id }, { _id: user._id }] },
        { $set: { password: hashedPassword } }
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Password successfully updated. You may now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/auth/profile & POST /api/auth/profile
// @desc    Update currently logged-in user profile & employee details
const handleProfileUpdate = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, bio, avatar } = req.body;
    const userId = req.user.id || req.user._id;

    const user = store.users.find(u => u.id === userId || u._id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isUserAdmin = req.user.role === 'admin';
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      if (!isUserAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Bawal palitan ang workplace email address: Only the System Administrator is authorized to modify workplace email addresses.'
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    // Update linked employee
    let updatedEmp = null;
    if (user.employee) {
      const emp = store.employees.find(e => e.id === user.employee || e._id === user.employee);
      if (emp) {
        if (firstName) emp.firstName = firstName.trim();
        if (lastName) emp.lastName = lastName.trim();
        if (phone) emp.phone = phone.trim();
        if (email && isUserAdmin) emp.email = email.toLowerCase().trim();
        if (bio !== undefined) emp.bio = bio;
        if (avatar !== undefined) emp.avatar = avatar;
        updatedEmp = emp;
      }
    }

    // Sync to MongoDB Atlas if connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      await db.collection('users').updateOne(
        { $or: [{ id: userId }, { _id: userId }, { username: user.username }] },
        { $set: { email: user.email, ...(avatar !== undefined ? { avatar } : {}) } }
      ).catch(() => {});

      if (updatedEmp) {
        await db.collection('employees').updateOne(
          { $or: [{ id: updatedEmp.id }, { _id: updatedEmp._id }, { employeeId: updatedEmp.employeeId }] },
          { $set: updatedEmp }
        ).catch(() => {});
      }
    }

    const finalAvatar = avatar !== undefined ? avatar : (user.avatar || updatedEmp?.avatar || '');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: finalAvatar,
        employee: updatedEmp ? { ...updatedEmp, avatar: finalAvatar } : null
      }
    });
  } catch (err) {
    next(err);
  }
};

router.put('/profile', authenticate, handleProfileUpdate);
router.post('/profile', authenticate, handleProfileUpdate);

// @route   PUT /api/auth/change-password
// @desc    Change password from user settings
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id || req.user._id;

    const user = store.users.find(u => u.id === userId || u._id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password. Please try again.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;

    // Sync to MongoDB Atlas if connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.collection('users').updateOne(
        { $or: [{ id: userId }, { _id: userId }] },
        { $set: { password: hashedPassword } }
      ).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Password successfully changed. Your new credentials are now active.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
