import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Mail, 
  Phone, 
  Building2, 
  Eye, 
  EyeOff,
  Download,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { api, getLocalDateString } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UserAvatar from '../components/UserAvatar';
import { exportToCsv } from '../utils/exportCsv';
import { generatePdfDocument } from '../utils/exportPdf';

const getNextEmployeeId = (list = []) => {
  let maxId = 1000;
  list.forEach(emp => {
    if (emp && emp.employeeId) {
      const match = emp.employeeId.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (!isNaN(val) && val > maxId) {
          maxId = val;
        }
      }
    }
  });
  return `EMP-${maxId + 1}`;
};

export default function Employees() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // View drawer
  const [profileModal, setProfileModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    status: 'Active',
    shift: 'Standard (9:00 AM - 5:00 PM)',
    createAccount: true,
    username: '',
    password: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        api.getEmployees({
          ...(selectedDept !== 'All' ? { department: selectedDept } : {}),
          ...(selectedStatus !== 'All' ? { status: selectedStatus } : {})
        }),
        api.getDepartments()
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, selectedStatus]);

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    const nextId = getNextEmployeeId(employees);
    setForm({
      employeeId: nextId,
      firstName: '',
      lastName: '',
      email: '',
      phone: '+63 917 ',
      department: departments[0]?.id || departments[0]?._id || '',
      position: '',
      salary: '',
      status: 'Active',
      shift: 'Standard (9:00 AM - 5:00 PM)',
      createAccount: true,
      username: '',
      password: ''
    });
    setFormError('');
    setShowPassword(false);
    setModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('action') === 'new' && !loading) {
      openAddModal();
    }
  }, [searchParams, loading]);

  const openEditModal = (emp) => {
    setIsEditing(true);
    setEditId(emp.id || emp._id);
    setForm({
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department?.id || emp.department?._id || emp.department || '',
      position: emp.position,
      salary: emp.salary ?? '',
      status: emp.status,
      shift: emp.shift || 'Standard (9:00 AM - 5:00 PM)',
      createAccount: false,
      username: '',
      password: ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const openProfileDrawer = (emp) => {
    setSelectedEmp(emp);
    setProfileModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (!isEditing && form.createAccount) {
        if (!form.username || form.username.trim().length < 3) {
          setFormError('Account username must be at least 3 characters long.');
          setFormLoading(false);
          return;
        }
        if (!form.password || form.password.length < 6) {
          setFormError('Account password must be at least 6 characters long.');
          setFormLoading(false);
          return;
        }
      }

      const payload = {
        ...form,
        salary: form.salary === '' ? 0 : parseFloat(form.salary) || 0
      };

      if (isEditing) {
        await api.updateEmployee(editId, payload);
      } else {
        await api.createEmployee(payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove employee "${name}"?`)) return;
    try {
      await api.deleteEmployee(id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const id = emp.employeeId.toLowerCase();
    const email = emp.email.toLowerCase();
    const pos = emp.position.toLowerCase();
    return fullName.includes(s) || id.includes(s) || email.includes(s) || pos.includes(s);
  });

  const totalRecords = filteredEmployees.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  const handleExportEmployeesCsv = () => {
    const headers = [
      { label: 'Employee ID', key: 'employeeId' },
      { label: 'First Name', key: 'firstName' },
      { label: 'Last Name', key: 'lastName' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Department', key: e => e.department?.name || '' },
      { label: 'Position', key: 'position' },
      { label: 'Shift', key: 'shift' },
      { label: 'Monthly Salary (PHP)', key: 'salary' },
      { label: 'Status', key: 'status' }
    ];
    exportToCsv(`employee_directory_${getLocalDateString(new Date())}`, headers, filteredEmployees);
  };

  const handleExportEmployeesPdf = () => {
    const headers = ['Employee ID', 'Full Name', 'Department', 'Position', 'Shift Schedule', 'Monthly Salary', 'Status'];
    const rows = filteredEmployees.map(e => [
      e.employeeId || '—',
      `${e.firstName} ${e.lastName}`,
      e.department?.name || 'Unassigned',
      e.position || '—',
      e.shift || 'Standard',
      e.salary ? `PHP ${Number(e.salary).toLocaleString()}` : '—',
      e.status || 'Active'
    ]);

    generatePdfDocument({
      title: 'Institutional Workforce Directory & Personnel Roster',
      subtitle: `Official Employee Master Listing • Department Filter: ${selectedDept !== 'All' ? selectedDept : 'All Departments'}`,
      meta: [
        `Active Filter: Department (${selectedDept}) | Status (${selectedStatus})`,
        `Total Listed Personnel: ${filteredEmployees.length} staff members`,
        `Exported by: ${user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user?.username || 'Administrator')}`
      ],
      headers,
      rows,
      filename: `employee_roster_${getLocalDateString(new Date())}`,
      landscape: true,
      includeSignatures: true
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
            Workforce roster, departmental assignments, and personnel verification.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportEmployeesPdf}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-800 hover:to-red-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download directory roster as formal PDF document"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportEmployeesCsv}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download directory roster as Excel CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Roster (CSV)</span>
          </button>

          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-medium shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>

        {(search || selectedDept !== 'All' || selectedStatus !== 'All') && (
          <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
            <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
            <button
              onClick={() => {
                setSearch('');
                setSelectedDept('All');
                setSelectedStatus('All');
              }}
              className="text-slate-900 hover:underline font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs">Loading directory...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
            No employees found matching the filters.
          </div>
        ) : (
          paginatedEmployees.map((emp) => (
            <div
              key={emp.id || emp._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={`${emp.firstName} ${emp.lastName}`} avatar={emp.avatar} size="lg" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{emp.firstName} {emp.lastName}</h4>
                      <p className="text-[11px] text-slate-600 font-medium">{emp.position}</p>
                      <span className="text-[10px] font-mono text-slate-400">{emp.employeeId}</span>
                    </div>
                  </div>

                  <StatusBadge status={emp.status} />
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px]">{emp.department?.name || 'Department'}</span>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] truncate">{emp.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px]">{emp.phone}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => openProfileDrawer(emp)}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Details</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id || emp._id, `${emp.firstName} ${emp.lastName}`)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Directory Pagination Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 select-none">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-900">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-slate-900">{endIndex}</strong> of <strong className="text-slate-900">{totalRecords}</strong> staff members
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Display:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value={6}>6 per page</option>
              <option value={9}>9 per page</option>
              <option value={15}>15 per page</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 text-xs font-semibold text-slate-800">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalRecords === 0}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Edit Staff Profile' : 'Enroll New Staff Member'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = { ...form, firstName: val };
                      if (!isEditing && form.createAccount && (!form.username || form.username === form.firstName.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
                        updated.username = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                      }
                      setForm(updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Employee ID
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Auto-Generated
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    readOnly
                    value={form.employeeId}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800 cursor-not-allowed select-none focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    System sequence number ({form.employeeId}) to ensure unique IDs.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Department
                  </label>
                  <select
                    required
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d.id || d._id} value={d.id || d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Position Title
                  </label>
                  <input
                    type="text"
                    required
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Monthly Salary (PHP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50000"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Roster Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Assigned Shift
                  </label>
                  <input
                    type="text"
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                    placeholder="Standard (9:00 AM - 5:00 PM)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Login Account & Password Requirements */}
              {!isEditing && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-700" />
                      <span className="font-bold text-xs text-amber-950">
                        Employee Portal & Login Account
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.createAccount}
                        onChange={(e) => setForm({ ...form, createAccount: e.target.checked })}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Create login credentials</span>
                    </label>
                  </div>

                  {form.createAccount && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                            Login Username
                          </label>
                          <input
                            type="text"
                            required={form.createAccount}
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                            placeholder="e.g. diether"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                            Portal Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required={form.createAccount}
                              value={form.password}
                              onChange={(e) => setForm({ ...form, password: e.target.value })}
                              placeholder="Min 6 characters"
                              className="w-full px-3 py-2 pr-8 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Password Requirements Checklist */}
                      <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/60 text-[11px] space-y-1">
                        <div className="font-semibold text-slate-700 flex items-center justify-between text-[11px]">
                          <span>Password Minimum Requirements:</span>
                          <span className={form.password.length >= 6 ? 'text-emerald-700 font-bold' : 'text-amber-800 font-medium'}>
                            {form.password.length}/6 characters
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] pt-0.5">
                          <span className={`inline-flex items-center gap-1 font-medium ${form.password.length >= 6 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <CheckCircle2 className={`w-3 h-3 ${form.password.length >= 6 ? 'text-emerald-600' : 'text-slate-300'}`} />
                            Minimum 6 characters (Required)
                          </span>
                          <span className={`inline-flex items-center gap-1 font-medium ${/\d/.test(form.password) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <CheckCircle2 className={`w-3 h-3 ${/\d/.test(form.password) ? 'text-emerald-600' : 'text-slate-300'}`} />
                            Includes at least 1 number
                          </span>
                          <span className={`inline-flex items-center gap-1 font-medium ${/[a-zA-Z]/.test(form.password) ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                            <CheckCircle2 className={`w-3 h-3 ${/[a-zA-Z]/.test(form.password) ? 'text-emerald-600' : 'text-slate-300'}`} />
                            Includes letters
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-medium shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      {profileModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Staff Profile Record</h3>
              <button
                onClick={() => setProfileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 mb-5">
              <UserAvatar name={`${selectedEmp.firstName} ${selectedEmp.lastName}`} avatar={selectedEmp.avatar} size="xl" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedEmp.firstName} {selectedEmp.lastName}</h4>
                <p className="text-xs text-slate-600 font-medium">{selectedEmp.position}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedEmp.employeeId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 mb-4">
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Department</span>
                <span className="font-semibold text-slate-800 text-xs">{selectedEmp.department?.name || 'Department'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedEmp.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Email</span>
                <span className="font-medium text-slate-700 text-xs truncate block">{selectedEmp.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Phone</span>
                <span className="font-medium text-slate-700 text-xs">{selectedEmp.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Shift Schedule</span>
                <span className="font-medium text-slate-700 text-xs">{selectedEmp.shift}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[10px]">Monthly Compensation</span>
                <span className="font-semibold text-slate-800 text-xs">₱{selectedEmp.salary.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setProfileModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
