const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/api/reports', require('./routes/reports'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Employee Attendance Management System API',
    collections: ['users', 'departments', 'employees', 'attendance', 'leaves']
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Background MongoDB connection with fallback for zero-config team member setup
const defaultMongoUri = 'mongodb+srv://onggocoDB:onggocoDB@cluster0.k6oanwe.mongodb.net/attendance_db?retryWrites=true&w=majority&appName=Cluster0';
const mongoUri = process.env.MONGODB_URI || defaultMongoUri;

if (mongoUri && mongoUri.trim() !== '') {
  const mongoose = require('mongoose');
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 })
    .then(() => console.log('🍃 [MongoDB] Connected to database server successfully.'))
    .catch(err => console.log('⚡ [Data Store] MongoDB offline or unreachable. Active in fast In-Memory Store mode with full 5 collections & sample data ready for presentation!'));
} else {
  console.log('⚡ [Data Store] Standalone In-Memory Store active with all 5 collections and team members ready for presentation.');
}

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Employee Attendance Management Backend Server Running`);
  console.log(`🌐 Server Port: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
