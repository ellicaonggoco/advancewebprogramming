import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Download,
  FileText,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  FileEdit,
  Clock,
  Check,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Lock,
  Users,
  UserCheck
} from 'lucide-react';
import { api, getLocalDateString } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UserAvatar from '../components/UserAvatar';
import AttendanceCalendar from '../components/AttendanceCalendar';
import { exportToCsv } from '../utils/exportCsv';
import { generatePdfDocument } from '../utils/exportPdf';

export default function Attendance() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [attendance, setAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Navigation Tab: 'calendar' | 'logs' | 'adjustments'
  const [activeTab, setActiveTab] = useState('calendar');
  const [adjustments, setAdjustments] = useState([]);
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjStatusFilter, setAdjStatusFilter] = useState('All');
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [reviewAdjModal, setReviewAdjModal] = useState({ open: false, adj: null, action: 'Approved', notes: '' });

  // Overtime Mandate State (Admin Permission System)
  const [otMandates, setOtMandates] = useState([]);
  const [otMandateModalOpen, setOtMandateModalOpen] = useState(false);
  const [otForm, setOtForm] = useState({
    employeeId: '',
    reason: 'Approved Project Sprint / Operational Requirement',
    allEmployees: false,
    maxHours: 4
  });
  const [otLoading, setOtLoading] = useState(false);
  const [otError, setOtError] = useState('');
  const [otSuccess, setOtSuccess] = useState('');

  // Adjustment Form State
  const [adjForm, setAdjForm] = useState({
    employeeId: '',
    date: getLocalDateString(new Date()),
    requestedTimeIn: '08:50 AM',
    requestedTimeOut: '05:05 PM',
    reason: ''
  });

  // Filters & Month Logs
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [form, setForm] = useState({
    employee: '',
    date: getLocalDateString(new Date()),
    timeIn: '08:50 AM',
    timeOut: '05:05 PM',
    status: 'Present',
    notes: '',
    lateMinutes: 0,
    workHours: 8.25
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [attRes, deptRes, empRes, leaveRes, otRes] = await Promise.all([
        api.getAttendance(),
        api.getDepartments(),
        api.getEmployees(),
        api.getLeaves(),
        api.getOvertimeAuthorizations({ date: getLocalDateString(new Date()) }).catch(() => ({ success: false }))
      ]);

      if (attRes.success) setAttendance(attRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
      if (empRes.success) setEmployees(empRes.data);
      if (leaveRes?.success) setLeaves(leaveRes.data);
      if (otRes?.success && otRes.data) setOtMandates(otRes.data);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeOtMandate = async (e) => {
    e.preventDefault();
    setOtLoading(true);
    setOtError('');
    setOtSuccess('');
    try {
      const isAll = otForm.allEmployees || otForm.employeeId === 'ALL';
      const res = await api.authorizeOvertime({
        employeeId: isAll ? null : otForm.employeeId,
        allEmployees: isAll,
        date: getLocalDateString(new Date()),
        reason: otForm.reason,
        maxHours: otForm.maxHours
      });
      setOtSuccess(res.message);
      await loadData();
      setTimeout(() => {
        setOtMandateModalOpen(false);
        setOtSuccess('');
      }, 1400);
    } catch (err) {
      setOtError(err.message || 'Failed to authorize overtime');
    } finally {
      setOtLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({
      employee: employees[0]?.id || employees[0]?._id || '',
      date: getLocalDateString(new Date()),
      timeIn: '08:50 AM',
      timeOut: '05:05 PM',
      status: 'Present',
      notes: '',
      lateMinutes: 0,
      workHours: 8.25
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (rec) => {
    setIsEditing(true);
    setEditId(rec.id || rec._id);
    setForm({
      employee: rec.employee?.id || rec.employee?._id || '',
      date: rec.date,
      timeIn: rec.timeIn || '',
      timeOut: rec.timeOut || '',
      status: rec.status,
      notes: rec.notes || '',
      lateMinutes: rec.lateMinutes || 0,
      workHours: rec.workHours || 0
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        ...form,
        workHours: form.workHours === '' ? 0 : parseFloat(form.workHours) || 0,
        lateMinutes: form.lateMinutes === '' ? 0 : parseInt(form.lateMinutes) || 0
      };

      if (isEditing) {
        await api.updateAttendance(editId, payload);
      } else {
        await api.createManualAttendance(payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await api.deleteAttendance(id);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete record');
    }
  };

  const loadAdjustments = async () => {
    try {
      setAdjLoading(true);
      const res = await api.getAdjustments({
        ...(adjStatusFilter !== 'All' ? { status: adjStatusFilter } : {})
      });
      if (res.success) {
        setAdjustments(res.data);
      }
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    } finally {
      setAdjLoading(false);
    }
  };

  useEffect(() => {
    loadAdjustments();
  }, [adjStatusFilter]);

  // Synchronize URL search parameters (e.g. from TimeClockWidget or Dashboard links)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['calendar', 'logs', 'adjustments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const actionParam = searchParams.get('action');
    if (actionParam === 'new' || actionParam === 'adjust') {
      setActiveTab('adjustments');
      openApplyAdjustment();
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams, employees, user, setSearchParams]);

  const handleExportAttendanceCsv = () => {
    const headers = [
      { label: 'Employee ID', key: r => r.employee?.employeeId || '' },
      { label: 'Staff Member', key: r => r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Unassigned' },
      { label: 'Department', key: r => r.employee?.department?.name || '' },
      { label: 'Date', key: 'date' },
      { label: 'Time In', key: r => r.timeIn || '—' },
      { label: 'Time Out', key: r => r.timeOut || '—' },
      { label: 'Hours Worked', key: r => r.workHours ?? '' },
      { label: 'Status', key: 'status' },
      { label: 'Late Minutes', key: r => r.lateMinutes || 0 },
      { label: 'Method / Notes', key: r => r.notes || r.method || 'Standard Entry' }
    ];
    const dateSuffix = selectedDate || (selectedMonth !== 'All' ? selectedMonth : getLocalDateString(new Date()));
    exportToCsv(`attendance_records_${dateSuffix}`, headers, filteredAttendance);
  };

  const handleExportAttendancePdf = () => {
    const headers = ['Employee ID', 'Staff Member', 'Department', 'Date', 'Time In', 'Time Out', 'Hours', 'Status', 'Notes'];
    const rows = filteredAttendance.map(r => [
      r.employee?.employeeId || '—',
      r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : 'Unassigned',
      r.employee?.department?.name || '—',
      r.date || '—',
      r.timeIn || '—',
      r.timeOut || '—',
      r.workHours !== undefined ? `${r.workHours}h` : '—',
      r.status || 'Present',
      r.notes || r.method || 'Standard Entry'
    ]);
    const dateSuffix = selectedDate || (selectedMonth !== 'All' ? selectedMonth : getLocalDateString(new Date()));
    generatePdfDocument({
      title: 'Attendance Audit Records Report',
      subtitle: `Formal Timesheet Audit • Filter: ${selectedStatus} • Period: ${selectedMonth !== 'All' ? selectedMonth : 'Full Master Log'}`,
      meta: [
        `Reporting Period: ${selectedMonth !== 'All' ? selectedMonth : 'All Records'}  |  Status Filter: ${selectedStatus}`,
        `Department Filter: ${selectedDepartment !== 'All' ? selectedDepartment : 'All Departments'}  |  Total Audited Logs: ${filteredAttendance.length}`,
        `Audited by: ${user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user?.username || 'Administrator')}`
      ],
      headers,
      rows,
      filename: `attendance_audit_report_${dateSuffix}`,
      landscape: true
    });
  };

  const handleExportAdjustmentsPdf = () => {
    const filteredAdjs = adjStatusFilter === 'All' ? adjustments : adjustments.filter(a => a.status === adjStatusFilter);
    const headers = ['Staff Member', 'Employee ID', 'Date', 'Requested Time In', 'Requested Time Out', 'Reason', 'Status', 'Supervisor Review Notes'];
    const rows = filteredAdjs.map(a => [
      a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : 'Unassigned',
      a.employee?.employeeId || '—',
      a.date || '—',
      a.requestedTimeIn || '—',
      a.requestedTimeOut || '—',
      a.reason || 'Punch adjustment request',
      a.status || 'Pending',
      a.reviewNotes || 'Under audit review'
    ]);

    generatePdfDocument({
      title: 'Time Corrections & Attendance Adjustment Audit Trail',
      subtitle: `Formal Timesheet Modification Requests • Filter: ${adjStatusFilter} Status`,
      meta: [
        `Adjustment Audit Scope: ${adjStatusFilter} Status Requests  |  Total Audited Requests: ${filteredAdjs.length}`,
        `Audited by: ${user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user?.username || 'Administrator')}`,
        `Audit Notice: Approved adjustments automatically update verified timesheet records`
      ],
      headers,
      rows,
      filename: `attendance_adjustments_audit_${adjStatusFilter.toLowerCase()}_${getLocalDateString(new Date())}`,
      landscape: true,
      includeSignatures: true
    });
  };

  const openApplyAdjustment = () => {
    const defaultEmpId = user?.employee ? (user.employee.id || user.employee._id) : (employees[0]?.id || employees[0]?._id || '');
    setAdjForm({
      employeeId: defaultEmpId,
      date: getLocalDateString(new Date()),
      requestedTimeIn: '08:50 AM',
      requestedTimeOut: '05:05 PM',
      reason: ''
    });
    setFormError('');
    setAdjModalOpen(true);
  };

  const handleApplyAdjustment = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await api.applyAdjustment(adjForm);
      setAdjModalOpen(false);
      await loadAdjustments();
      setActiveTab('adjustments');
    } catch (err) {
      setFormError(err.message || 'Failed to submit adjustment request');
    } finally {
      setFormLoading(false);
    }
  };

  const openReviewAdjustment = (adj, action) => {
    setReviewAdjModal({
      open: true,
      adj,
      action,
      notes: action === 'Approved' ? 'Approved by HR Administrator.' : 'Unable to verify requested adjustment.'
    });
  };

  const handleReviewAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.reviewAdjustment(reviewAdjModal.adj.id || reviewAdjModal.adj._id, {
        status: reviewAdjModal.action,
        reviewNotes: reviewAdjModal.notes
      });
      setReviewAdjModal({ open: false, adj: null, action: 'Approved', notes: '' });
      await Promise.all([loadData(), loadAdjustments()]);
    } catch (err) {
      alert(err.message || 'Failed to review adjustment request');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAdjustment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this adjustment request?')) return;
    try {
      await api.deleteAdjustment(id);
      await loadAdjustments();
    } catch (err) {
      alert(err.message || 'Failed to cancel adjustment request');
    }
  };

  const pendingAdjustmentsCount = adjustments.filter(a => a.status === 'Pending').length;

  const filteredAttendance = attendance.filter((rec) => {
    // 1. Text Search
    if (search) {
      const s = search.toLowerCase();
      const empName = `${rec.employee?.firstName || ''} ${rec.employee?.lastName || ''}`.toLowerCase();
      const empId = (rec.employee?.employeeId || '').toLowerCase();
      const notes = (rec.notes || '').toLowerCase();
      if (!empName.includes(s) && !empId.includes(s) && !notes.includes(s)) return false;
    }

    // 2. Month filter
    if (selectedMonth !== 'All') {
      if (!rec.date || !rec.date.startsWith(selectedMonth)) return false;
    }

    // 3. Date filter
    if (selectedDate) {
      if (rec.date !== selectedDate) return false;
    }

    // 4. Department filter (Admin only)
    if (selectedDepartment !== 'All') {
      const deptId = rec.employee?.department?.id || rec.employee?.department?._id;
      if (deptId !== selectedDepartment) return false;
    }

    // 5. Status filter
    if (selectedStatus !== 'All') {
      if (rec.status !== selectedStatus) return false;
    }

    return true;
  });

  const totalRecords = filteredAttendance.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            {isAdmin ? 'Attendance Records' : 'My Attendance Logs'}
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {isAdmin 
              ? 'Institutional timekeeping, shift compliance logs, and time-in/out records.'
              : 'Review your personal check-ins, shift timestamps, and monthly history.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAttendancePdf}
            className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download audit records as official PDF document"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportAttendanceCsv}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition flex items-center gap-1.5 cursor-pointer"
            title="Download records as Excel-ready CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={openApplyAdjustment}
            className="px-3.5 py-1.5 rounded-lg bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileEdit className="w-3.5 h-3.5 text-[#DFC090]" />
            <span>Request Time Adjustment</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setOtForm({
                    employeeId: 'ALL',
                    reason: 'Approved Operational Duty / Project Sprint',
                    allEmployees: true,
                    maxHours: 4
                  });
                  setOtError('');
                  setOtSuccess('');
                  setOtMandateModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Admin: Mandate and authorize employee for overtime duty"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-950" />
                <span>Authorize Overtime</span>
              </button>

              <button
                onClick={openAddModal}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Manual Record</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'bg-zinc-900 text-white font-semibold shadow-xs'
              : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-[#DFC090]" />
          <span>Attendance Calendar (Holidays & Rest Days)</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-zinc-900 text-white font-semibold shadow-xs'
              : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isAdmin ? 'Attendance Audit Records' : 'My Attendance Logs'}</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'adjustments'
              ? 'bg-zinc-900 text-white font-semibold shadow-xs'
              : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5 text-[#DFC090]" />
          <span>{isAdmin ? 'Time Adjustment Requests' : 'My Adjustment Requests'}</span>
          {pendingAdjustmentsCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'adjustments' ? 'bg-amber-400 text-zinc-950' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingAdjustmentsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <AttendanceCalendar
          attendance={attendance}
          leaves={leaves}
          employees={employees}
          targetEmployee={user?.employee}
          isAdmin={isAdmin}
        />
      )}

      {activeTab === 'logs' && (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-xl p-3.5 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2.5">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-2.5`}>
          {/* Search Box - Admin only */}
          {isAdmin && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search staff name, ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-50/80 border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
              />
            </div>
          )}

          {/* Month Scope Logs */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedDate('');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-50/80 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white cursor-pointer font-medium"
              title="Select Month for Attendance Logs"
            >
              <option value="All">All Months (Full Audit)</option>
              <option value="2026-10">October 2026 (Current)</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          </div>

          {/* Specific Date Picker */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-50/80 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white cursor-pointer"
              title="Filter by Specific Day"
            />
          </div>

          {/* Department Filter - Admin only */}
          {isAdmin && (
            <div>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-50/80 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white cursor-pointer"
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id || d._id} value={d.id || d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-50/80 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present (Whole Day)</option>
              <option value="Late">Late Arrival</option>
              <option value="Half-Day">Half-Day (4h+)</option>
              <option value="Undertime">Undertime (&lt;4h)</option>
              <option value="Incomplete Shift">Incomplete / Invalid (&lt;1h)</option>
              <option value="On Leave">On Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>

        {(selectedMonth !== 'All' || selectedDate || (isAdmin && selectedDepartment !== 'All') || selectedStatus !== 'All' || (isAdmin && search)) && (
          <div className="flex items-center justify-between text-xs pt-1 text-zinc-500">
            <span>
              Showing {filteredAttendance.length} matching logs {selectedMonth !== 'All' ? `for ${selectedMonth}` : ''}
            </span>
            <button
              onClick={() => {
                setSelectedMonth('All');
                setSelectedDate('');
                setSelectedDepartment('All');
                setSelectedStatus('All');
                setSearch('');
                setCurrentPage(1);
              }}
              className="text-zinc-900 hover:underline font-medium cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 uppercase tracking-wider text-[11px] font-medium">
                {isAdmin && <th className="py-3 px-4 font-medium">Staff Member</th>}
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Time In</th>
                <th className="py-3 px-4 font-medium">Time Out</th>
                <th className="py-3 px-4 font-medium">Duration</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Method / Notes</th>
                {isAdmin && <th className="py-3 px-4 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="py-12 text-center text-zinc-400">
                    <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading records...</span>
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} className="py-12 text-center text-zinc-400 text-xs">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedAttendance.map((rec) => {
                  const staffName = rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : 'Unassigned';
                  return (
                    <tr key={rec.id || rec._id} className="hover:bg-zinc-50/70 transition-colors">
                      {isAdmin && (
                        <td className="py-3 px-4 font-medium text-zinc-900">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={staffName} avatar={rec.employee?.avatar} size="sm" />
                            <div>
                              <p className="font-medium text-zinc-900 text-xs">{staffName}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">{rec.employee?.employeeId} • {rec.employee?.department?.name || 'Department'}</p>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="py-3 px-4 font-mono text-zinc-600 whitespace-nowrap text-xs">
                        {rec.date}
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-800 whitespace-nowrap text-xs">
                        {rec.timeIn || '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-800 whitespace-nowrap text-xs">
                        {rec.timeOut || '—'}
                      </td>

                      <td className="py-3 px-4 text-zinc-700 whitespace-nowrap text-xs">
                        {rec.workHours > 0 ? `${rec.workHours} hrs` : '—'}
                      </td>

                      {/* Clean Refined Status Indicator */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={rec.status} lateMinutes={rec.lateMinutes} />
                      </td>

                      <td className="py-3 px-4 text-zinc-500 max-w-xs truncate text-xs">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-medium text-zinc-400 tracking-wider">{rec.method}</span>
                          <span className="truncate text-zinc-600 text-[11px]">{rec.notes || 'Normal entry'}</span>
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(rec)}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(rec.id || rec._id)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Executive Pagination Footer */}
        <div className="p-3 bg-zinc-50/70 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 select-none">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-zinc-900">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-zinc-900">{endIndex}</strong> of <strong className="text-zinc-900">{totalRecords}</strong> logs
            </span>
            <span className="text-zinc-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded bg-white border border-zinc-200 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-zinc-400 text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-7 h-7 px-2 rounded text-xs font-medium transition cursor-pointer ${
                          currentPage === page
                            ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalRecords === 0}
              className="p-1.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalRecords === 0}
              className="p-1.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Time Adjustment Requests View */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setAdjStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer text-xs ${
                    adjStatusFilter === status
                      ? 'bg-zinc-900 text-white font-semibold'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {status} Requests
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                onClick={handleExportAdjustmentsPdf}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-800 hover:to-red-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Download adjustments audit trail as formal PDF document"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Audit (PDF)</span>
              </button>

              <button
                onClick={openApplyAdjustment}
                className="px-3.5 py-1.5 rounded-xl bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5 text-[#DFC090]" />
                <span>File Adjustment</span>
              </button>
            </div>
          </div>

          {/* Adjustments Table */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 uppercase tracking-wider text-[11px] font-medium">
                    {isAdmin && <th className="py-3 px-4 font-medium">Staff Member</th>}
                    <th className="py-3 px-4 font-medium">Attendance Date</th>
                    <th className="py-3 px-4 font-medium">Requested Shift</th>
                    <th className="py-3 px-4 font-medium">Reason / Problem Details</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {adjLoading ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-zinc-400">
                        <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span>Loading adjustment requests...</span>
                      </td>
                    </tr>
                  ) : adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-zinc-400 text-xs">
                        No attendance adjustment requests found for this status.
                      </td>
                    </tr>
                  ) : (
                    adjustments.map((adj) => {
                      const staffName = adj.employee ? `${adj.employee.firstName} ${adj.employee.lastName}` : 'Staff Member';
                      return (
                        <tr key={adj.id || adj._id} className="hover:bg-zinc-50/70 transition-colors">
                          {isAdmin && (
                            <td className="py-3.5 px-4 font-medium text-zinc-900">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar name={staffName} avatar={adj.employee?.avatar} size="sm" />
                                <div>
                                  <p className="font-semibold text-zinc-900 text-xs">{staffName}</p>
                                  <p className="text-[10px] text-zinc-400 font-mono">{adj.employee?.employeeId} • {adj.employee?.department?.name || 'Department'}</p>
                                </div>
                              </div>
                            </td>
                          )}

                          <td className="py-3.5 px-4 font-mono text-zinc-700 whitespace-nowrap text-xs font-medium">
                            {adj.date}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono">
                            <span className="text-emerald-700 font-medium">{adj.requestedTimeIn}</span>
                            <span className="text-zinc-400 mx-1.5">→</span>
                            <span className="text-amber-700 font-medium">{adj.requestedTimeOut}</span>
                          </td>

                          <td className="py-3.5 px-4 text-zinc-600 max-w-xs text-xs">
                            <p className="font-medium text-zinc-900 truncate">{adj.reason}</p>
                            {adj.reviewNotes && (
                              <p className="text-[10px] text-zinc-400 italic mt-0.5 truncate">
                                Admin note: {adj.reviewNotes}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={adj.status} />
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isAdmin && adj.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => openReviewAdjustment(adj, 'Approved')}
                                    className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 font-medium text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                  >
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => openReviewAdjustment(adj, 'Rejected')}
                                    className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/80 font-medium text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                  >
                                    <X className="w-3 h-3 text-rose-600" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {(isAdmin || adj.status === 'Pending') && (
                                <button
                                  onClick={() => handleDeleteAdjustment(adj.id || adj._id)}
                                  className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Cancel Request"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {!isAdmin && adj.status !== 'Pending' && (
                                <span className="text-[11px] text-zinc-400 font-medium">Processed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="text-sm font-semibold text-zinc-900">
                {isEditing ? 'Edit Attendance Record' : 'Log Manual Attendance Record'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200/70 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Staff Member
                </label>
                <select
                  disabled={isEditing}
                  value={form.employee}
                  onChange={(e) => setForm({ ...form, employee: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-900 disabled:opacity-60"
                  required
                >
                  {employees.map((e) => (
                    <option key={e.id || e._id} value={e.id || e._id}>
                      {e.firstName} {e.lastName} ({e.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="Present">Present (Whole Day)</option>
                    <option value="Late">Late Arrival</option>
                    <option value="Half-Day">Half-Day (4h+)</option>
                    <option value="Undertime">Undertime (&lt;4h)</option>
                    <option value="Incomplete Shift">Incomplete Shift (&lt;1h)</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    Time In
                  </label>
                  <input
                    type="text"
                    placeholder="08:50 AM"
                    value={form.timeIn}
                    onChange={(e) => setForm({ ...form, timeIn: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    Time Out
                  </label>
                  <input
                    type="text"
                    placeholder="05:00 PM"
                    value={form.timeOut}
                    onChange={(e) => setForm({ ...form, timeOut: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 8.0"
                    value={form.workHours}
                    onFocus={(e) => {
                      if (form.workHours === 0 || form.workHours === '0') {
                        setForm({ ...form, workHours: '' });
                      } else {
                        e.target.select();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleaned = val === '' ? '' : val.replace(/^0+(?=\d)/, '');
                      setForm({ ...form, workHours: cleaned });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                    Late Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.lateMinutes}
                    onFocus={(e) => {
                      if (form.lateMinutes === 0 || form.lateMinutes === '0') {
                        setForm({ ...form, lateMinutes: '' });
                      } else {
                        e.target.select();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleaned = val === '' ? '' : val.replace(/^0+(?=\d)/, '');
                      setForm({ ...form, lateMinutes: cleaned });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Notes
                </label>
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Approved overtime, transit delay"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Confirm Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Adjustment Modal */}
      {adjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#39333B] text-[#DFC090] flex items-center justify-center">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Request Attendance Adjustment</h3>
                  <p className="text-[11px] text-zinc-400">File correction for missed punch or time dispute</p>
                </div>
              </div>
              <button
                onClick={() => setAdjModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
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

            <form onSubmit={handleApplyAdjustment} className="space-y-3.5 text-xs">
              {isAdmin && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                    Staff Member
                  </label>
                  <select
                    value={adjForm.employeeId}
                    onChange={(e) => setAdjForm({ ...adjForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-900"
                    required
                  >
                    {employees.map((e) => (
                      <option key={e.id || e._id} value={e.id || e._id}>
                        {e.firstName} {e.lastName} ({e.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                  Target Attendance Date
                </label>
                <input
                  type="date"
                  required
                  value={adjForm.date}
                  onChange={(e) => setAdjForm({ ...adjForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                    Requested Time-In
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="08:50 AM"
                    value={adjForm.requestedTimeIn}
                    onChange={(e) => setAdjForm({ ...adjForm, requestedTimeIn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                    Requested Time-Out
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="05:05 PM"
                    value={adjForm.requestedTimeOut}
                    onChange={(e) => setAdjForm({ ...adjForm, requestedTimeOut: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
                  Reason / Problem Details
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Forgot to clock out before leaving for client visit, biometric reader network outage, emergency morning meeting..."
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setAdjModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5 text-[#DFC090]" />
                  <span>{formLoading ? 'Submitting...' : 'Submit for HR Approval'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Adjustment Modal (Admin) */}
      {reviewAdjModal.open && reviewAdjModal.adj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="text-sm font-bold text-zinc-900">
                {reviewAdjModal.action === 'Approved' ? 'Approve Time Adjustment' : 'Reject Time Adjustment'}
              </h3>
              <button
                onClick={() => setReviewAdjModal({ open: false, adj: null, action: 'Approved', notes: '' })}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewAdjustmentSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Applicant:</span>
                  <span className="font-semibold text-zinc-900">
                    {reviewAdjModal.adj.employee?.firstName} {reviewAdjModal.adj.employee?.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Target Date:</span>
                  <span className="font-mono font-medium text-zinc-800">{reviewAdjModal.adj.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Requested Shift:</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {reviewAdjModal.adj.requestedTimeIn} → {reviewAdjModal.adj.requestedTimeOut}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-zinc-200/70">
                  <span className="text-zinc-400 block mb-0.5">Stated Reason:</span>
                  <p className="text-zinc-700 italic">"{reviewAdjModal.adj.reason}"</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Supervisory Audit Notes
                </label>
                <input
                  type="text"
                  required
                  value={reviewAdjModal.notes}
                  onChange={(e) => setReviewAdjModal({ ...reviewAdjModal, notes: e.target.value })}
                  placeholder="e.g. Verified with department supervisor, approved."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewAdjModal({ open: false, adj: null, action: 'Approved', notes: '' })}
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-1.5 ${
                    reviewAdjModal.action === 'Approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {reviewAdjModal.action === 'Approved' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-white" />}
                  <span>{formLoading ? 'Processing...' : `Confirm ${reviewAdjModal.action}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authorize Overtime Duty Modal (Admin Only) */}
      {otMandateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative text-left">
            <button
              onClick={() => setOtMandateModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Authorize Overtime Duty</h3>
                <p className="text-xs text-zinc-500">Administrator Work Mandate & Approval</p>
              </div>
            </div>

            {otSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{otSuccess}</span>
              </div>
            )}

            {otError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{otError}</span>
              </div>
            )}

            <form onSubmit={handleAuthorizeOtMandate} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-1.5 text-amber-950">
                <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Mandatory Overtime Authorization Policy:
                </p>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  Bawal mag-clock in para sa Overtime ang sinumang kawani nang walang pahintulot. Ang pag-authorize dito ang magbubukas ng yellow "Record Overtime In" button sa kanilang dashboard.
                </p>
              </div>

              {/* Target / Scope Selection */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider">
                  Target Staff (Saklaw ng Overtime)
                </label>

                {/* Quick Segmented Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOtForm({ ...otForm, allEmployees: true, employeeId: 'ALL' })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      otForm.allEmployees || otForm.employeeId === 'ALL'
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm ring-2 ring-amber-400/40'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-zinc-950" />
                    <span>To All Employees (Lahat)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const firstEmp = employees[0]?.id || employees[0]?._id || '';
                      setOtForm({
                        ...otForm,
                        allEmployees: false,
                        employeeId: otForm.employeeId === 'ALL' ? firstEmp : otForm.employeeId
                      });
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      !otForm.allEmployees && otForm.employeeId !== 'ALL'
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm ring-2 ring-amber-400/40'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Specific Employee Lamang</span>
                  </button>
                </div>

                {/* Dropdown with "ALL EMPLOYEES" option always prominent at top */}
                <div>
                  <select
                    value={otForm.allEmployees || otForm.employeeId === 'ALL' ? 'ALL' : otForm.employeeId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'ALL') {
                        setOtForm({ ...otForm, allEmployees: true, employeeId: 'ALL' });
                      } else {
                        setOtForm({ ...otForm, allEmployees: false, employeeId: val });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                  >
                    <option value="ALL" className="font-bold text-amber-950 bg-amber-100">
                      🏢 TO ALL EMPLOYEES / ENTIRE WORKFORCE (Lahat ng Kawani - {employees.length} Staff)
                    </option>
                    <optgroup label="── O pumili ng indibidwal na kawani ──">
                      {employees.map(emp => (
                        <option key={emp.id || emp._id} value={emp.id || emp._id}>
                          {emp.employeeId} — {emp.firstName} {emp.lastName} ({emp.department?.name || 'Staff'})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Scope Confirmation Callout */}
                {(otForm.allEmployees || otForm.employeeId === 'ALL') ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0 font-bold mt-0.5">
                      <Users className="w-3.5 h-3.5 text-zinc-950" />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        <span>Lahat ng {employees.length} Kawani ay Bibigyan ng OT Permission</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-200 text-amber-950 font-extrabold uppercase">Workforce-Wide</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                        Hindi na kailangang isa-isahin. Awtomatikong magiging aktibo ang yellow "Record Overtime In" para sa lahat ng empleyado sa buong kumpanya.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px]">Tanging ang napiling staff member lamang ang bibigyan ng permiso mag-overtime ngayong araw.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                  Overtime Project Mandate / Reason
                </label>
                <input
                  type="text"
                  required
                  value={otForm.reason}
                  onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                  placeholder="e.g. Critical release sprint, weekend operational support..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:ring-1 focus:ring-zinc-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setOtMandateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs font-bold shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-950" />
                  <span>
                    {otLoading 
                      ? 'Authorizing...' 
                      : (otForm.allEmployees || otForm.employeeId === 'ALL')
                        ? 'Authorize All Employees (Lahat)'
                        : 'Grant Overtime Authorization'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
