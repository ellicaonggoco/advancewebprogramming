const mongoose = require('mongoose');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

const formatDate = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const seedDatabase = async () => {
  try {
    console.log('[Database Seed] Checking MongoDB Atlas collections...');

    // Drop and re-seed to ensure all the user's real team names are populated cleanly
    await Promise.all([
      Department.deleteMany({}),
      Employee.deleteMany({}),
      User.deleteMany({}),
      Attendance.deleteMany({}),
      LeaveRequest.deleteMany({})
    ]);

    console.log('[Database Seed] Seeding official team records into MongoDB Atlas...');

    // 1. Departments (5 Departments)
    const departments = await Department.create([
      {
        name: 'Executive & Project Management',
        code: 'EXEC',
        description: 'Strategic direction, project leadership, and organizational administration',
        managerName: 'Ellica Chris Onggoco',
        budget: 650000
      },
      {
        name: 'Information Technology & Engineering',
        code: 'IT',
        description: 'Software architecture, database infrastructure, and UI/UX design',
        managerName: 'John Herzsel Datul',
        budget: 550000
      },
      {
        name: 'Human Resources & Compliance',
        code: 'HR',
        description: 'Workforce timekeeping, personnel relations, and employee records',
        managerName: 'Diether Baculpo',
        budget: 300000
      },
      {
        name: 'Operations & Quality Assurance',
        code: 'OPS',
        description: 'Quality assurance testing, operational logistics, and systems support',
        managerName: 'John Michael Nolasco',
        budget: 350000
      },
      {
        name: 'Finance & Business Analytics',
        code: 'FIN',
        description: 'Financial reporting, budgets, payroll calculations, and fiscal audits',
        managerName: 'Clark Manlapaz',
        budget: 400000
      }
    ]);

    const [execDept, itDept, hrDept, opsDept, finDept] = departments;

    // 2. Employees (All 7 real group members!)
    const employees = await Employee.create([
      {
        employeeId: 'EMP-1001',
        firstName: 'Ellica Chris',
        lastName: 'Onggoco',
        email: 'ellica.onggoco@company.com',
        phone: '+63 917 123 4501',
        department: execDept._id,
        position: 'System Administrator & Project Director',
        hireDate: new Date('2021-01-15'),
        salary: 125000,
        status: 'Active',
        shift: 'Executive Flexible (8:30 AM - 4:30 PM)',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80'
      },
      {
        employeeId: 'EMP-1002',
        firstName: 'John Herzsel',
        lastName: 'Datul',
        email: 'herzsel.datul@company.com',
        phone: '+63 917 123 4502',
        department: itDept._id,
        position: 'Lead Systems Architect & Full-Stack Engineer',
        hireDate: new Date('2021-03-10'),
        salary: 95000,
        status: 'Active',
        shift: 'Standard (9:00 AM - 5:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
      },
      {
        employeeId: 'EMP-1003',
        firstName: 'John Rafael',
        lastName: 'Corpuz',
        email: 'rafael.corpuz@company.com',
        phone: '+63 917 123 4503',
        department: itDept._id,
        position: 'Systems Analyst & Database Engineer',
        hireDate: new Date('2021-05-18'),
        salary: 88000,
        status: 'Active',
        shift: 'Standard (9:00 AM - 5:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80'
      },
      {
        employeeId: 'EMP-1004',
        firstName: 'Neil Chester Mari',
        lastName: 'Garcia',
        email: 'neil.garcia@company.com',
        phone: '+63 917 123 4504',
        department: itDept._id,
        position: 'Frontend Engineer & UI/UX Specialist',
        hireDate: new Date('2022-02-01'),
        salary: 85000,
        status: 'Active',
        shift: 'Standard (9:00 AM - 5:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
      },
      {
        employeeId: 'EMP-1005',
        firstName: 'John Michael',
        lastName: 'Nolasco',
        email: 'michael.nolasco@company.com',
        phone: '+63 917 123 4505',
        department: opsDept._id,
        position: 'Operations & Quality Assurance Lead',
        hireDate: new Date('2022-04-15'),
        salary: 80000,
        status: 'Active',
        shift: 'Standard (9:00 AM - 5:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80'
      },
      {
        employeeId: 'EMP-1006',
        firstName: 'Diether',
        lastName: 'Baculpo',
        email: 'diether.baculpo@company.com',
        phone: '+63 917 123 4506',
        department: hrDept._id,
        position: 'HR & Personnel Compliance Specialist',
        hireDate: new Date('2022-07-20'),
        salary: 78000,
        status: 'Active',
        shift: 'Standard (9:00 AM - 5:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80'
      },
      {
        employeeId: 'EMP-1007',
        firstName: 'Clark',
        lastName: 'Manlapaz',
        email: 'clark.manlapaz@company.com',
        phone: '+63 917 123 4507',
        department: finDept._id,
        position: 'Financial Operations & Analytics Specialist',
        hireDate: new Date('2022-09-01'),
        salary: 78000,
        status: 'Active',
        shift: 'Standard (9:00 AM - 5:00 PM)',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80'
      }
    ]);

    // 3. Users for all 7 team members
    await User.create([
      {
        username: 'ellica',
        email: 'ellica.onggoco@company.com',
        password: 'admin123',
        role: 'admin',
        employee: employees[0]._id,
        status: 'active'
      },
      {
        username: 'herzsel',
        email: 'herzsel.datul@company.com',
        password: 'employee123',
        role: 'employee',
        employee: employees[1]._id,
        status: 'active'
      },
      {
        username: 'rafael',
        email: 'rafael.corpuz@company.com',
        password: 'employee123',
        role: 'employee',
        employee: employees[2]._id,
        status: 'active'
      },
      {
        username: 'neil',
        email: 'neil.garcia@company.com',
        password: 'employee123',
        role: 'employee',
        employee: employees[3]._id,
        status: 'active'
      },
      {
        username: 'michael',
        email: 'michael.nolasco@company.com',
        password: 'employee123',
        role: 'employee',
        employee: employees[4]._id,
        status: 'active'
      },
      {
        username: 'diether',
        email: 'diether.baculpo@company.com',
        password: 'employee123',
        role: 'employee',
        employee: employees[5]._id,
        status: 'active'
      },
      {
        username: 'clark',
        email: 'clark.manlapaz@company.com',
        password: 'employee123',
        role: 'employee',
        employee: employees[6]._id,
        status: 'active'
      }
    ]);

    // 4. Attendance Records for Today and Past 5 Business Days
    const now = new Date();
    const todayStr = formatDate(now);
    const attendanceRecords = [];

    // Today's live records
    attendanceRecords.push(
      { employee: employees[0]._id, date: todayStr, timeIn: '08:45 AM', timeOut: '05:05 PM', status: 'Present', workHours: 8.33, lateMinutes: 0, method: 'Web Clock-In', notes: 'Executive morning briefing' },
      { employee: employees[1]._id, date: todayStr, timeIn: '08:52 AM', timeOut: '05:15 PM', status: 'Present', workHours: 8.38, lateMinutes: 0, method: 'Web Clock-In', notes: 'Core architecture review' },
      { employee: employees[2]._id, date: todayStr, timeIn: '08:58 AM', timeOut: '05:00 PM', status: 'Present', workHours: 8.03, lateMinutes: 0, method: 'Web Clock-In', notes: 'Database replication sync' },
      { employee: employees[3]._id, date: todayStr, timeIn: '09:18 AM', timeOut: '05:30 PM', status: 'Late', workHours: 8.20, lateMinutes: 18, method: 'Web Clock-In', notes: 'Highway transit delay' },
      { employee: employees[4]._id, date: todayStr, timeIn: '08:40 AM', timeOut: '05:00 PM', status: 'Present', workHours: 8.33, lateMinutes: 0, method: 'Web Clock-In', notes: 'Automated test suite run' },
      { employee: employees[5]._id, date: todayStr, timeIn: '08:50 AM', timeOut: '01:00 PM', status: 'Half-Day', workHours: 4.17, lateMinutes: 0, method: 'Web Clock-In', notes: 'Approved personal afternoon off' },
      { employee: employees[6]._id, date: todayStr, timeIn: null, timeOut: null, status: 'On Leave', workHours: 0, lateMinutes: 0, method: 'System Auto', notes: 'Approved Vacation Leave' }
    );

    // Past 5 business days
    for (let i = 1; i <= 5; i++) {
      const pastDay = new Date(now);
      pastDay.setDate(now.getDate() - i);
      if (pastDay.getDay() === 0 || pastDay.getDay() === 6) continue;

      const pastDateStr = formatDate(pastDay);
      employees.forEach((emp, idx) => {
        const isLeave = emp._id.toString() === employees[6]._id.toString() && i <= 2;
        const isLate = emp._id.toString() === employees[3]._id.toString() && i === 3;
        attendanceRecords.push({
          employee: emp._id,
          date: pastDateStr,
          timeIn: isLeave ? null : (isLate ? '09:25 AM' : '08:50 AM'),
          timeOut: isLeave ? null : '05:10 PM',
          status: isLeave ? 'On Leave' : (isLate ? 'Late' : 'Present'),
          workHours: isLeave ? 0 : 8.33,
          lateMinutes: isLate ? 25 : 0,
          method: isLeave ? 'System Auto' : 'Web Clock-In',
          notes: isLeave ? 'Approved leave' : 'Regular workday'
        });
      });
    }

    await Attendance.create(attendanceRecords);

    // 5. Leave Requests
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const inThreeDays = new Date(now);
    inThreeDays.setDate(now.getDate() + 3);

    await LeaveRequest.create([
      {
        employee: employees[6]._id, // Clark Manlapaz
        leaveType: 'Vacation Leave',
        startDate: todayStr,
        endDate: formatDate(inThreeDays),
        daysCount: 3,
        reason: 'Annual scheduled family vacation trip',
        status: 'Approved',
        reviewedBy: 'Ellica Chris Onggoco',
        reviewNotes: 'Approved. Enjoy your time off!'
      },
      {
        employee: employees[3]._id, // Neil Chester Mari Garcia
        leaveType: 'Sick Leave',
        startDate: formatDate(tomorrow),
        endDate: formatDate(tomorrow),
        daysCount: 1,
        reason: 'Medical consultation and rest',
        status: 'Pending',
        reviewedBy: null,
        reviewNotes: ''
      },
      {
        employee: employees[4]._id, // John Michael Nolasco
        leaveType: 'Emergency Leave',
        startDate: todayStr,
        endDate: todayStr,
        daysCount: 1,
        reason: 'Home residential electrical inspection',
        status: 'Rejected',
        reviewedBy: 'Ellica Chris Onggoco',
        reviewNotes: 'Please reschedule due to the scheduled QA sprint deadline.'
      }
    ]);

    console.log('✅ [Database Seed] Successfully seeded MongoDB Atlas with all group members:');
    console.log('   👑 Ellica Chris Onggoco (Admin)');
    console.log('   💻 John Herzsel Datul');
    console.log('   🗄️ John Rafael Corpuz');
    console.log('   🎨 Neil Chester Mari Garcia');
    console.log('   ⚙️ John Michael Nolasco');
    console.log('   👥 Diether Baculpo');
    console.log('   📊 Clark Manlapaz');
  } catch (err) {
    console.error('❌ [Database Seed Error]:', err);
  }
};

module.exports = seedDatabase;
