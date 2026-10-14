const mongoose = require('mongoose');
const seedDatabase = require('./seed');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    console.log('[Database] Connecting to live MongoDB Atlas cluster...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('🍃 [Database] Connected to MongoDB Atlas (employee_attendance database) successfully.');
    await seedDatabase();
  } catch (err) {
    console.error('❌ [Database Connection Error]:', err.message);
  }
};

module.exports = connectDB;
