const BASE_URL = 'http://localhost:5000/api';

export const getLocalDateString = (d = new Date()) => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('attendance_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || (data.errors ? data.errors.map(e => e.msg).join(', ') : 'Request failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  changePassword: (passwordData) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(passwordData) }),
  getMe: () => request('/auth/me'),

  // Departments
  getDepartments: () => request('/departments'),
  getDepartment: (id) => request(`/departments/${id}`),
  createDepartment: (dept) => request('/departments', { method: 'POST', body: JSON.stringify(dept) }),
  updateDepartment: (id, dept) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(dept) }),
  deleteDepartment: (id) => request(`/departments/${id}`, { method: 'DELETE' }),

  // Employees
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/employees${query ? `?${query}` : ''}`);
  },
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (emp) => request('/employees', { method: 'POST', body: JSON.stringify(emp) }),
  updateEmployee: (id, emp) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(emp) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance${query ? `?${query}` : ''}`);
  },
  getTodaySummary: () => request('/attendance/today-summary'),
  clockIn: (payload = {}) => request('/attendance/clock-in', { method: 'POST', body: JSON.stringify(payload) }),
  clockOut: (payload = {}) => request('/attendance/clock-out', { method: 'POST', body: JSON.stringify(payload) }),
  resetTodayAttendance: (payload = {}) => request('/attendance/reset-today', { method: 'POST', body: JSON.stringify(payload) }),
  createManualAttendance: (record) => request('/attendance/manual', { method: 'POST', body: JSON.stringify(record) }),
  updateAttendance: (id, record) => request(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(record) }),
  deleteAttendance: (id) => request(`/attendance/${id}`, { method: 'DELETE' }),

  // Attendance Adjustments (Time Corrections)
  getAdjustments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/adjustments${query ? `?${query}` : ''}`);
  },
  applyAdjustment: (payload) => request('/attendance/adjustments', { method: 'POST', body: JSON.stringify(payload) }),
  reviewAdjustment: (id, payload) => request(`/attendance/adjustments/${id}/review`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAdjustment: (id) => request(`/attendance/adjustments/${id}`, { method: 'DELETE' }),

  // Leave Requests
  getLeaves: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/leaves${query ? `?${query}` : ''}`);
  },
  applyLeave: (leaveData) => request('/leaves', { method: 'POST', body: JSON.stringify(leaveData) }),
  updateLeaveStatus: (id, statusData) => request(`/leaves/${id}/status`, { method: 'PUT', body: JSON.stringify(statusData) }),
  deleteLeave: (id) => request(`/leaves/${id}`, { method: 'DELETE' }),

  // Reports
  getDashboardStats: () => request('/reports/dashboard-stats'),
  getMonthlySummaryReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/monthly-summary${query ? `?${query}` : ''}`);
  },
  getDepartmentAnalyticsReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/department-analytics${query ? `?${query}` : ''}`);
  },
};
