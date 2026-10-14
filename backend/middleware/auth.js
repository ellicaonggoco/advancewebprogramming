const jwt = require('jsonwebtoken');
const store = require('../database/store');

const JWT_SECRET = process.env.JWT_SECRET || 'attendance_management_secret_key_2026';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Look up user from store
    const user = store.users.find(u => u.id === decoded.id || u._id === decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user no longer exists.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User account has been deactivated.'
      });
    }

    // Attach linked employee
    const employees = store.getPopulatedEmployees();
    const linkedEmp = employees.find(e => e.id === user.employee || e._id === user.employee);

    req.user = {
      id: user.id || user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar || linkedEmp?.avatar || '',
      employee: linkedEmp || null,
      status: user.status
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Authentication token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles.`
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize, JWT_SECRET };
