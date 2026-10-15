import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  CheckCircle2, 
  X,
  AlertCircle,
  Download 
} from 'lucide-react';
import { api, getLocalDateString } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { generatePdfDocument } from '../utils/exportPdf';
import { exportToCsv } from '../utils/exportCsv';

export default function Departments() {
  const { user, isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    managerName: '',
    budget: 300000
  });

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.getDepartments();
      if (res.success) setDepartments(res.data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({
      name: '',
      code: '',
      description: '',
      managerName: '',
      budget: ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setIsEditing(true);
    setEditId(dept.id || dept._id);
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      managerName: dept.managerName || '',
      budget: dept.budget ?? ''
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
        budget: form.budget === '' ? 0 : parseFloat(form.budget) || 0
      };

      if (isEditing) {
        await api.updateDepartment(editId, payload);
      } else {
        await api.createDepartment(payload);
      }
      setModalOpen(false);
      await loadDepartments();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
    try {
      await api.deleteDepartment(id);
      await loadDepartments();
    } catch (err) {
      alert(err.message || 'Failed to delete department');
    }
  };

  const handleExportDeptPdf = () => {
    try {
      const headers = ['Department Code', 'Department Name', 'Head / Manager', 'Annual Budget (PHP)', 'Total Staff Assigned'];
      const rows = departments.map(d => [
        d.code || '—',
        d.name || '—',
        d.managerName || 'Unassigned',
        d.budget ? `PHP ${Number(d.budget).toLocaleString()}` : '—',
        d.employeeCount !== undefined ? `${d.employeeCount} active members` : 'Assigned per roster'
      ]);

      const authorName = user?.employee 
        ? `${user.employee.firstName} ${user.employee.lastName}` 
        : (user?.username || 'Administrator');

      generatePdfDocument({
        title: 'Institutional Departmental Directory & Hierarchy',
        subtitle: 'Official Organizational Structure, Leadership, and Budgetary Allocation',
        meta: [
          `Total Active Departments: ${departments.length} divisions`,
          `Exported by: ${authorName}`,
          `Document Type: Master Institutional Directory Audit`
        ],
        headers,
        rows,
        filename: `department_directory_${getLocalDateString(new Date())}`,
        landscape: false,
        includeSignatures: true
      });
    } catch (err) {
      console.error('Failed to export department PDF:', err);
      alert('Unable to generate PDF document. Please check console.');
    }
  };

  const handleExportDeptCsv = () => {
    const headers = [
      { label: 'Department Code', key: 'code' },
      { label: 'Department Name', key: 'name' },
      { label: 'Head / Manager', key: 'managerName' },
      { label: 'Annual Budget (PHP)', key: 'budget' },
      { label: 'Description', key: 'description' },
      { label: 'Total Staff Assigned', key: d => d.employeeCount ?? 0 }
    ];
    exportToCsv(`departments_directory_${getLocalDateString(new Date())}`, headers, departments);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Departments</h2>
          <p className="text-xs text-slate-500 mt-1">
            Institutional division of responsibilities, leadership, and operational budgets.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportDeptPdf}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-800 hover:to-red-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download department directory as formal PDF document"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Directory (PDF)</span>
          </button>

          <button
            onClick={handleExportDeptCsv}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Download department directory as Excel CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {isAdmin && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#483F4B] text-white text-xs font-medium shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs">Loading departments...</span>
          </div>
        ) : departments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
            No departments found.
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept.id || dept._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    {dept.code}
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                        title="Edit Department"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id || dept._id, dept.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm mb-1">{dept.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{dept.description || 'No description provided.'}</p>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Department Lead</span>
                    <span className="font-semibold text-slate-900">{dept.managerName || 'Unassigned'}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Assigned Roster</span>
                    <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {dept.employeeCount || 0} staff
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Annual Budget</span>
                    <span className="font-semibold text-slate-900">
                      ₱{(dept.budget || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Code: {dept.code}</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Operational
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Edit Department' : 'Create New Department'}
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
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal & Compliance"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Code (Uppercase)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LEG"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Annual Budget (PHP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 300000"
                    value={form.budget}
                    onFocus={(e) => {
                      if (form.budget === 0 || form.budget === '0') {
                        setForm({ ...form, budget: '' });
                      } else {
                        e.target.select();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleaned = val === '' ? '' : val.replace(/^0+(?=\d)/, '');
                      setForm({ ...form, budget: cleaned });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Manager / Lead
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={form.managerName}
                  onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Mandate and key functions"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs"
                ></textarea>
              </div>

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
                  {formLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
