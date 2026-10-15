const bcrypt = require('bcryptjs');

const formatDate = (d) => {
  const options = { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Intl.DateTimeFormat('en-CA', options).format(d);
};

// 1. Initial Departments
const initialDepartments = [
  { id: 'dept-1', _id: 'dept-1', name: 'Executive & Project Management', code: 'EXEC', description: 'Strategic direction, project leadership, and organizational administration', managerName: 'Ellica Chris Onggoco', budget: 650000, createdAt: new Date() },
  { id: 'dept-2', _id: 'dept-2', name: 'Information Technology & Engineering', code: 'IT', description: 'Software architecture, database infrastructure, and UI/UX design', managerName: 'John Herzsel Datul', budget: 550000, createdAt: new Date() },
  { id: 'dept-3', _id: 'dept-3', name: 'Human Resources & Compliance', code: 'HR', description: 'Workforce timekeeping, personnel relations, and employee records', managerName: 'Diether Baculpo', budget: 300000, createdAt: new Date() },
  { id: 'dept-4', _id: 'dept-4', name: 'Operations & Quality Assurance', code: 'OPS', description: 'Quality assurance testing, operational logistics, and systems support', managerName: 'John Michael Nolasco', budget: 350000, createdAt: new Date() },
  { id: 'dept-5', _id: 'dept-5', name: 'Finance & Business Analytics', code: 'FIN', description: 'Financial reporting, budgets, payroll calculations, and fiscal audits', managerName: 'Clark Manlapaz', budget: 400000, createdAt: new Date() },
];

// 2. Initial Employees (All 7 real group members)
const initialEmployees = [
  {
    id: 'emp-1',
    _id: 'emp-1',
    employeeId: 'EMP-1001',
    firstName: 'Ellica Chris',
    lastName: 'Onggoco',
    email: 'ellica.onggoco@company.com',
    phone: '+63 917 123 4501',
    department: 'dept-1',
    position: 'System Administrator & Project Director',
    hireDate: '2021-01-15',
    salary: 125000,
    status: 'Active',
    shift: 'Executive Flexible (8:30 AM - 4:30 PM)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date('2021-01-15')
  },
  {
    id: 'emp-2',
    _id: 'emp-2',
    employeeId: 'EMP-1002',
    firstName: 'John Herzsel',
    lastName: 'Datul',
    email: 'herzsel.datul@company.com',
    phone: '+63 917 123 4502',
    department: 'dept-2',
    position: 'Lead Systems Architect & Full-Stack Engineer',
    hireDate: '2021-03-10',
    salary: 95000,
    status: 'Active',
    shift: 'Standard (9:00 AM - 5:00 PM)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date('2021-03-10')
  },
  {
    id: 'emp-3',
    _id: 'emp-3',
    employeeId: 'EMP-1003',
    firstName: 'John Rafael',
    lastName: 'Corpuz',
    email: 'rafael.corpuz@company.com',
    phone: '+63 917 123 4503',
    department: 'dept-2',
    position: 'Systems Analyst & Database Engineer',
    hireDate: '2021-05-18',
    salary: 88000,
    status: 'Active',
    shift: 'Standard (9:00 AM - 5:00 PM)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date('2021-05-18')
  },
  {
    id: 'emp-4',
    _id: 'emp-4',
    employeeId: 'EMP-1004',
    firstName: 'Neil Chester Mari',
    lastName: 'Garcia',
    email: 'neil.garcia@company.com',
    phone: '+63 917 123 4504',
    department: 'dept-2',
    position: 'Frontend Engineer & UI/UX Specialist',
    hireDate: '2022-02-01',
    salary: 85000,
    status: 'Active',
    shift: 'Standard (9:00 AM - 5:00 PM)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date('2022-02-01')
  },
  {
    id: 'emp-5',
    _id: 'emp-5',
    employeeId: 'EMP-1005',
    firstName: 'John Michael',
    lastName: 'Nolasco',
    email: 'michael.nolasco@company.com',
    phone: '+63 917 123 4505',
    department: 'dept-4',
    position: 'Operations & Quality Assurance Lead',
    hireDate: '2022-04-15',
    salary: 80000,
    status: 'Active',
    shift: 'Standard (9:00 AM - 5:00 PM)',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date('2022-04-15')
  },
  {
    id: 'emp-6',
    _id: 'emp-6',
    employeeId: 'EMP-1006',
    firstName: 'Diether',
    lastName: 'Baculpo',
    email: 'diether.baculpo@company.com',
    phone: '+63 917 123 4506',
    department: 'dept-3',
    position: 'HR & Personnel Compliance Specialist',
    hireDate: '2022-07-20',
    salary: 78000,
    status: 'Active',
    shift: 'Standard (9:00 AM - 5:00 PM)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date('2022-07-20')
  },
  {
    id: 'emp-7',
    _id: 'emp-7',
    employeeId: 'EMP-1007',
    firstName: 'Clark',
    lastName: 'Manlapaz',
    email: 'clark.manlapaz@company.com',
    phone: '+63 917 123 4507',
    department: 'dept-5',
    position: 'Financial Operations & Analytics Specialist',
    hireDate: '2022-09-01',
    salary: 78000,
    status: 'Active',
    shift: 'Standard (9:00 AM - 5:00 PM)',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
    createdAt: new Date('2022-09-01')
  }
];

// 3. Initial Users
const salt = bcrypt.genSaltSync(10);
const initialUsers = [
  { id: 'user-1', _id: 'user-1', username: 'ellica', email: 'ellica.onggoco@company.com', password: bcrypt.hashSync('admin123', salt), role: 'admin', employee: 'emp-1', status: 'active', createdAt: new Date() },
  { id: 'user-2', _id: 'user-2', username: 'herzsel', email: 'herzsel.datul@company.com', password: bcrypt.hashSync('employee123', salt), role: 'employee', employee: 'emp-2', status: 'active', createdAt: new Date() },
  { id: 'user-3', _id: 'user-3', username: 'rafael', email: 'rafael.corpuz@company.com', password: bcrypt.hashSync('employee123', salt), role: 'employee', employee: 'emp-3', status: 'active', createdAt: new Date() },
  { id: 'user-4', _id: 'user-4', username: 'neil', email: 'neil.garcia@company.com', password: bcrypt.hashSync('employee123', salt), role: 'employee', employee: 'emp-4', status: 'active', createdAt: new Date() },
  { id: 'user-5', _id: 'user-5', username: 'michael', email: 'michael.nolasco@company.com', password: bcrypt.hashSync('employee123', salt), role: 'employee', employee: 'emp-5', status: 'active', createdAt: new Date() },
  { id: 'user-6', _id: 'user-6', username: 'diether', email: 'diether.baculpo@company.com', password: bcrypt.hashSync('employee123', salt), role: 'employee', employee: 'emp-6', status: 'active', createdAt: new Date() },
  { id: 'user-7', _id: 'user-7', username: 'clark', email: 'clark.manlapaz@company.com', password: bcrypt.hashSync('employee123', salt), role: 'employee', employee: 'emp-7', status: 'active', createdAt: new Date() },
];

// 4. Initial Attendance
const generateInitialAttendance = () => {
  const records = [];
  const now = new Date();
  const todayStr = formatDate(now);

  records.push(
    { id: 'att-1', _id: 'att-1', employee: 'emp-1', date: todayStr, timeIn: '08:45 AM', timeOut: null, status: 'Present', workHours: 8.25, lateMinutes: 0, method: 'Web Clock-In', notes: 'Executive morning briefing', location: 'Main Office', createdAt: new Date() },
    // Naka-time in na rin si John Herzsel Datul ng maaga (on time, within grace period)
    { id: 'att-2', _id: 'att-2', employee: 'emp-2', date: todayStr, timeIn: '08:52 AM', timeOut: null, status: 'Present', workHours: 8.25, lateMinutes: 0, method: 'Web Clock-In', notes: 'Systems architecture review', location: 'Main Office', createdAt: new Date() },
    { id: 'att-3', _id: 'att-3', employee: 'emp-3', date: todayStr, timeIn: '08:58 AM', timeOut: null, status: 'Present', workHours: 8.25, lateMinutes: 0, method: 'Web Clock-In', notes: 'Database replication sync', location: 'Main Office', createdAt: new Date() },
    { id: 'att-4', _id: 'att-4', employee: 'emp-4', date: todayStr, timeIn: null, timeOut: null, status: 'On Leave', workHours: 0, lateMinutes: 0, method: 'System Auto', notes: 'Approved Sick Leave (Official Leave of Absence)', location: 'Main Office', createdAt: new Date() },
    { id: 'att-5', _id: 'att-5', employee: 'emp-5', date: todayStr, timeIn: '08:40 AM', timeOut: null, status: 'Present', workHours: 8.25, lateMinutes: 0, method: 'Web Clock-In', notes: 'Automated test suite run', location: 'Main Office', createdAt: new Date() },
    { id: 'att-6', _id: 'att-6', employee: 'emp-6', date: todayStr, timeIn: '08:50 AM', timeOut: null, status: 'Present', workHours: 8.25, lateMinutes: 0, method: 'Web Clock-In', notes: 'Personnel morning shift', location: 'Main Office', createdAt: new Date() },
    { id: 'att-7', _id: 'att-7', employee: 'emp-7', date: todayStr, timeIn: '08:55 AM', timeOut: null, status: 'Present', workHours: 8.25, lateMinutes: 0, method: 'Web Clock-In', notes: 'Financial analytics morning shift', location: 'Main Office', createdAt: new Date() }
  );

  let count = 8;
  for (let i = 1; i <= 65; i++) {
    const pastDay = new Date(now);
    pastDay.setDate(now.getDate() - i);
    if (pastDay.getDay() === 0 || pastDay.getDay() === 6) continue;

    const pastDateStr = formatDate(pastDay);
    const emps = ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6', 'emp-7'];
    emps.forEach((empId) => {
      const pseudoRand = (i * 7 + empId.charCodeAt(4)) % 10;
      let status = 'Present';
      let timeIn = '08:50 AM';
      let timeOut = '05:05 PM';
      let workHours = 8.25;
      let lateMinutes = 0;
      let notes = 'Standard shift';

      if (pseudoRand === 1 && empId !== 'emp-1') {
        status = 'Late';
        timeIn = '09:22 AM';
        timeOut = '05:05 PM';
        lateMinutes = 22;
        workHours = 7.72; // Accurately calculated elapsed hours (09:22 AM to 05:05 PM = 7 hrs 43 mins = 7.72 hrs)
        notes = 'Morning transit congestion';
      } else if (pseudoRand === 3 && empId === 'emp-5') {
        status = 'Half-Day';
        timeIn = '08:45 AM';
        timeOut = '01:00 PM';
        workHours = 4.25;
        notes = 'Official afternoon assignment';
      }

      records.push({
        id: `att-${count}`,
        _id: `att-${count++}`,
        employee: empId,
        date: pastDateStr,
        timeIn,
        timeOut,
        status,
        workHours,
        lateMinutes,
        method: status === 'On Leave' ? 'System Auto' : 'Web Clock-In',
        notes,
        location: 'Main Office',
        createdAt: pastDay
      });
    });
  }

  return records;
};

// 5. Initial Leave Requests
const initialLeaves = [
  {
    id: 'leave-1',
    _id: 'leave-1',
    employee: 'emp-4',
    leaveType: 'Sick Leave',
    startDate: formatDate(new Date()),
    endDate: formatDate(new Date()),
    daysCount: 1,
    reason: 'Medical consultation and recovery',
    status: 'Approved',
    reviewedBy: 'Ellica Chris Onggoco',
    reviewNotes: 'Approved. Rest well and recover!',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: 'leave-2',
    _id: 'leave-2',
    employee: 'emp-5',
    leaveType: 'Emergency Leave',
    startDate: formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    endDate: formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    daysCount: 1,
    reason: 'Residential facility electrical maintenance',
    status: 'Pending',
    reviewedBy: null,
    reviewNotes: '',
    createdAt: new Date()
  },
  {
    id: 'leave-3',
    _id: 'leave-3',
    employee: 'emp-7',
    leaveType: 'Vacation Leave',
    startDate: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
    endDate: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
    daysCount: 1,
    reason: 'Personal family matter',
    status: 'Rejected',
    reviewedBy: 'Ellica Chris Onggoco',
    reviewNotes: 'Please reschedule due to active financial audit sprint.',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  }
];

// 6. Initial Attendance Adjustment Requests
const initialAdjustments = [
  {
    id: 'adj-1',
    _id: 'adj-1',
    employee: 'emp-3',
    date: formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
    requestedTimeIn: '08:55 AM',
    requestedTimeOut: '05:30 PM',
    reason: 'Power interruption at local facility delayed web time-in submission',
    status: 'Pending',
    reviewedBy: null,
    reviewNotes: '',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  }
];

const store = {
  departments: [...initialDepartments],
  employees: [...initialEmployees],
  users: [...initialUsers],
  attendance: generateInitialAttendance(),
  leaves: [...initialLeaves],
  adjustments: [...initialAdjustments],
  overtimeAuthorizations: [],

  getPopulatedEmployees() {
    return this.employees.map(emp => {
      const dept = this.departments.find(d => d.id === emp.department || d._id === emp.department);
      return {
        ...emp,
        department: dept ? { _id: dept.id, id: dept.id, name: dept.name, code: dept.code } : null,
        fullName: `${emp.firstName} ${emp.lastName}`
      };
    });
  },

  getPopulatedAttendance() {
    const populatedEmps = this.getPopulatedEmployees();
    return this.attendance.map(att => {
      const attEmpId = att.employee?.id || att.employee?._id || (typeof att.employee === 'string' ? att.employee : null);
      const emp = populatedEmps.find(e => e.id === attEmpId || e._id === attEmpId || e.id === att.employee || e._id === att.employee);

      // Auto-evaluate under-duration records (e.g. 1 minute shift punch)
      let status = att.status;
      let notes = att.notes;
      if (att.timeIn && att.timeOut && att.workHours !== undefined) {
        if (att.workHours < 1.0 && (status === 'Present' || status === 'Late')) {
          status = 'Incomplete Shift';
          if (!notes || notes === 'On time' || notes === 'Standard shift') {
            const mins = Math.max(1, Math.round(att.workHours * 60));
            notes = `Incomplete punch (${mins}m worked). Below minimum threshold (<1 hr). Not credited.`;
          }
        } else if (att.workHours < 4.0 && (status === 'Present' || status === 'Late')) {
          status = 'Undertime';
          if (!notes || notes === 'On time' || notes === 'Standard shift') {
            notes = `Undertime shift (${att.workHours} hrs worked < 4 hrs threshold). Incomplete day.`;
          }
        } else if (att.workHours < 7.5 && status === 'Present') {
          status = 'Half-Day';
          if (!notes || notes === 'On time' || notes === 'Standard shift') {
            notes = `Half-Day shift credited (${att.workHours} hrs worked).`;
          }
        }
      }

      return {
        ...att,
        status,
        notes,
        employee: emp || null
      };
    });
  },

  getPopulatedLeaves() {
    const populatedEmps = this.getPopulatedEmployees();
    return this.leaves.map(l => {
      const emp = populatedEmps.find(e => e.id === l.employee || e._id === l.employee);
      return {
        ...l,
        employee: emp || null
      };
    });
  },

  getPopulatedAdjustments() {
    const populatedEmps = this.getPopulatedEmployees();
    return this.adjustments.map(adj => {
      const emp = populatedEmps.find(e => e.id === adj.employee || e._id === adj.employee);
      return {
        ...adj,
        employee: emp || null
      };
    });
  },

  getPopulatedOvertimeAuthorizations() {
    const populatedEmps = this.getPopulatedEmployees();
    return (this.overtimeAuthorizations || []).map(auth => {
      const emp = populatedEmps.find(e => e.id === auth.employee || e._id === auth.employee);
      return {
        ...auth,
        employee: emp || null
      };
    });
  }
};

module.exports = store;
