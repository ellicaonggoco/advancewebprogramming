import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api, getLocalDateString } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import UserAvatar from '../components/UserAvatar';
import { exportToCsv } from '../utils/exportCsv';
import { generatePdfDocument } from '../utils/exportPdf';

export default function LeaveRequests() {
  const { user, isAdmin } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [form, setForm] = useState({
    employeeId: '',
    leaveType: 'Vacation Leave',
    startDate: getLocalDateString(new Date()),
    endDate: getLocalDateString(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
    reason: ''
  });

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const [leavesRes, empsRes] = await Promise.all([
        api.getLeaves({
          ...(statusFilter !== 'All' ? { status: statusFilter } : {})
        }),
        api.getEmployees()
      ]);

      if (leavesRes.success) setLeaves(leavesRes.data);
      if (empsRes.success) setEmployees(empsRes.data);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'apply' || params.get('action') === 'new') {
      openApplyModal();
    }
  }, [employees, user]);

  const totalRecords = leaves.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedLeaves = leaves.slice(startIndex, endIndex);

  const openApplyModal = () => {
    const defaultEmpId = user?.employee ? (user.employee.id || user.employee._id) : (employees[0]?.id || employees[0]?._id || '');
    setForm({
      employeeId: defaultEmpId,
      leaveType: 'Vacation Leave',
      startDate: getLocalDateString(new Date()),
      endDate: getLocalDateString(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
      reason: ''
    });
    setFormError('');
    setApplyModalOpen(true);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      await api.applyLeave(form);
      setApplyModalOpen(false);
      await loadLeaves();
    } catch (err) {
      setFormError(err.message || 'Failed to submit leave request');
    } finally {
      setFormLoading(false);
    }
  };

  const openReviewModal = (leave, action) => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setReviewNotes(action === 'Approved' ? 'Approved by Ellica Chris Onggoco (Administration).' : 'Unable to approve due to active sprint timeline.');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await api.updateLeaveStatus(selectedLeave.id || selectedLeave._id, {
        status: reviewAction,
        reviewNotes
      });
      setReviewModalOpen(false);
      await loadLeaves();
    } catch (err) {
      alert(err.message || 'Failed to review leave request');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await api.deleteLeave(id);
      await loadLeaves();
    } catch (err) {
      alert(err.message || 'Failed to cancel leave application');
    }
  };

  const handleExportLeavesCsv = () => {
    const headers = [
      { label: 'Employee ID', key: l => l.employee?.employeeId || '' },
      { label: 'Staff Member', key: l => l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Unassigned' },
      { label: 'Department', key: l => l.employee?.department?.name || '' },
      { label: 'Leave Type', key: 'leaveType' },
      { label: 'Days Count', key: 'daysCount' },
      { label: 'Start Date', key: 'startDate' },
      { label: 'End Date', key: 'endDate' },
      { label: 'Reason', key: 'reason' },
      { label: 'Status', key: 'status' },
      { label: 'Review Notes', key: l => l.reviewNotes || '' }
    ];
    exportToCsv(`leave_applications_${statusFilter}_${getLocalDateString(new Date())}`, headers, leaves);
  };

  const handleExportLeavesPdf = () => {
    const headers = ['Employee ID', 'Staff Member', 'Department', 'Leave Type', 'Duration', 'Start Date', 'End Date', 'Status', 'Review Notes'];
    const rows = leaves.map(l => [
      l.employee?.employeeId || '—',
      l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Unassigned',
      l.employee?.department?.name || '—',
      l.leaveType || 'Leave',
      l.daysCount ? `${l.daysCount} days` : '1 day',
      l.startDate || '—',
      l.endDate || '—',
      l.status || 'Pending',
      l.reviewNotes || l.reason || 'Filed per company policy'
    ]);

    generatePdfDocument({
      title: 'Workforce Leave & Absence Audit Report',
      subtitle: `Formal Leave Filing & Supervisory Disposition • Status: ${statusFilter} Requests`,
      meta: [
        `Status Filter: ${statusFilter} Applications  |  Total Audited Requests: ${leaves.length}`,
        `Audited by: ${user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user?.username || 'Administrator')}`,
        `Institutional Sync: Approved leaves reflect directly on attendance rosters`
      ],
      headers,
      rows,
      filename: `leave_requests_${statusFilter.toLowerCase()}_${getLocalDateString(new Date())}`,
      landscape: true,
      includeSignatures: true
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Leave Management & Approvals' : 'My Leave Requests'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'Formal leave filing, supervisory approvals, and automated attendance synchronization.'
              : 'Submit time-off applications, view supervisory approvals, and track leave balances.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportLeavesPdf}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-800 hover:to-red-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download leave requests as formal PDF document"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportLeavesCsv}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download leave requests as Excel CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openApplyModal}
            className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-medium shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-medium">
        {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer text-xs ${
              statusFilter === status
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status} Requests
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                {isAdmin && <th className="py-3 px-4">Staff Member</th>}
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading requests...</span>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400">
                    No leave requests found for this status.
                  </td>
                </tr>
              ) : (
                paginatedLeaves.map((l) => {
                  const staffName = l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Staff Member';
                  return (
                    <tr key={l.id || l._id} className="hover:bg-slate-50/70 transition">
                      {isAdmin && (
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={staffName} avatar={l.employee?.avatar} size="sm" />
                            <div>
                              <p className="font-semibold text-slate-900 text-xs">{staffName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{l.employee?.employeeId} • {l.employee?.department?.name || 'Department'}</p>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap text-xs">
                        {l.leaveType}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap text-xs">
                        {l.daysCount} day{l.daysCount > 1 ? 's' : ''}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap text-xs">
                        {l.startDate} → {l.endDate}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-sm text-xs">
                        <p className="font-medium text-slate-900 break-words leading-relaxed whitespace-normal" title={l.reason}>{l.reason}</p>
                        {l.reviewNotes && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5 break-words whitespace-normal" title={`Note: ${l.reviewNotes}`}>
                            Note: {l.reviewNotes}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={l.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && l.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => openReviewModal(l, 'Approved')}
                                className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 font-medium text-[11px] transition cursor-pointer flex items-center gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                              >
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openReviewModal(l, 'Rejected')}
                                className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/80 font-medium text-[11px] transition cursor-pointer flex items-center gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                              >
                                <X className="w-3 h-3 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {(isAdmin || l.status === 'Pending') && (
                            <button
                              onClick={() => handleDelete(l.id || l._id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title={isAdmin ? "Delete Application" : "Cancel Application"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isAdmin && l.status !== 'Pending' && (
                            <span className="text-[11px] text-slate-400 font-medium">Processed</span>
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

        {/* Executive Pagination Footer */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 select-none">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-900">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-slate-900">{endIndex}</strong> of <strong className="text-slate-900">{totalRecords}</strong> requests
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
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
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Apply for Leave of Absence</h3>
              <button
                onClick={() => setApplyModalOpen(false)}
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

            <form onSubmit={handleApply} className="space-y-4 text-xs">
              {isAdmin && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Select Staff
                  </label>
                  <select
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
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
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Leave Classification
                </label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                >
                  <option value="Vacation Leave">Vacation Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                  <option value="Bereavement Leave">Bereavement Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Reason / Purpose
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="State the justification for this leave request"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-medium shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {reviewAction === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                <p><strong>Staff:</strong> {selectedLeave.employee?.firstName} {selectedLeave.employee?.lastName}</p>
                <p><strong>Type:</strong> {selectedLeave.leaveType} ({selectedLeave.daysCount} days)</p>
                <p><strong>Period:</strong> {selectedLeave.startDate} to {selectedLeave.endDate}</p>
                <p><strong>Reason:</strong> {selectedLeave.reason}</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Reviewer Notes / Feedback
                </label>
                <textarea
                  rows="3"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-medium shadow-sm transition cursor-pointer disabled:opacity-50 ${
                    reviewAction === 'Approved' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {formLoading ? 'Processing...' : `Confirm ${reviewAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
