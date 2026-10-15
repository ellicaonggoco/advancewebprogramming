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
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      console.log('🍃 [MongoDB] Connected to database server successfully.');
      try {
        const store = require('./database/store');
        const db = mongoose.connection.db;

        // Hydrate users (preserve uploaded avatars, updated passwords, etc.)
        const mongoUsers = await db.collection('users').find().toArray();
        if (mongoUsers && mongoUsers.length > 0) {
          mongoUsers.forEach(mu => {
            const idx = store.users.findIndex(u => 
              (u.id && u.id === mu.id) || 
              (u.username && mu.username && u.username.toLowerCase() === mu.username.toLowerCase())
            );
            if (idx >= 0) {
              store.users[idx] = { ...store.users[idx], ...mu };
            } else {
              store.users.push(mu);
            }
          });
          console.log(`🍃 [MongoDB] Hydrated ${mongoUsers.length} users with persistent profiles & avatars.`);
        }

        // Hydrate employees (preserve uploaded avatars, profiles, new records)
        const mongoEmps = await db.collection('employees').find().toArray();
        if (mongoEmps && mongoEmps.length > 0) {
          mongoEmps.forEach(me => {
            const idx = store.employees.findIndex(e => 
              (e.id && e.id === me.id) || 
              (e.employeeId && me.employeeId && e.employeeId === me.employeeId)
            );
            if (idx >= 0) {
              store.employees[idx] = { ...store.employees[idx], ...me };
            } else {
              store.employees.push(me);
            }
          });
          console.log(`🍃 [MongoDB] Hydrated ${mongoEmps.length} employees with persistent profiles & avatars.`);
        }
      } catch (hydrateErr) {
        console.warn('MongoDB hydration warning:', hydrateErr.message);
      }
    })
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
