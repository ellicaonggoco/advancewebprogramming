import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download,
  FileText,
  Users, 
  Building2, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../utils/exportCsv';
import { generatePdfDocument } from '../utils/exportPdf';

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('monthly');
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [monthlyData, setMonthlyData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDeptObj = departments.find(d => d.id === selectedDept || d._id === selectedDept);
  const currentDeptLabel = currentDeptObj ? `${currentDeptObj.name} (${currentDeptObj.code})` : 'All Departments';

  const loadReports = async () => {
    try {
      setLoading(true);
      const [deptListRes, monthlyRes, deptAnalyticsRes] = await Promise.all([
        api.getDepartments(),
        api.getMonthlySummaryReport({
          month: selectedMonth,
          year: selectedYear,
          ...(selectedDept !== 'All' ? { departmentId: selectedDept } : {})
        }),
        api.getDepartmentAnalyticsReport({
          month: selectedMonth,
          year: selectedYear,
          ...(selectedDept !== 'All' ? { departmentId: selectedDept } : {})
        })
      ]);

      if (deptListRes.success) setDepartments(deptListRes.data);
      if (monthlyRes.success) setMonthlyData(monthlyRes.data);
      if (deptAnalyticsRes.success) setDepartmentData(deptAnalyticsRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedMonth, selectedYear, selectedDept]);

  // Direct Print: Binubuksan yung standard browser print dialog para pwedeng i-print agad sa paper o i-save as local PDF
  const handlePrint = () => {
    window.print();
  };

  // CSV Export: Kino-convert yung attendance data papuntang spreadsheet format (.csv) para madaling buksan sa Microsoft Excel o Google Sheets
  const handleExportMonthlyCsv = () => {
    const headers = [
      { label: 'Employee ID', key: 'employeeId' },
      { label: 'Staff Member', key: 'name' },
      { label: 'Department', key: 'department' },
      { label: 'Days Worked', key: 'daysWorked' },
      { label: 'On-Time Days', key: 'presentDays' },
      { label: 'Late Days', key: 'lateDays' },
      { label: 'On Leave Days', key: 'onLeaveDays' },
      { label: 'Total Late Minutes', key: 'totalLateMinutes' },
      { label: 'Total Hours Logged', key: 'totalHours' },
      { label: 'Compliance Rate (%)', key: 'complianceRate' }
    ];
    exportToCsv(`monthly_attendance_summary_${selectedMonth}_${selectedYear}`, headers, monthlyData);
  };

  // CSV Export para sa Department Cross-Analytics
  const handleExportDeptCsv = () => {
    const headers = [
      { label: 'Department Code', key: 'departmentCode' },
      { label: 'Department Name', key: 'departmentName' },
      { label: 'Department Head', key: 'managerName' },
      { label: 'Assigned Staff', key: 'totalEmployees' },
      { label: 'Hours Worked', key: 'totalHoursWorked' },
      { label: 'Punctuality Rate (%)', key: 'punctualityRate' },
      { label: 'Approved Leaves', key: 'approvedLeaves' },
      { label: 'Pending Leaves', key: 'pendingLeaves' }
    ];
    exportToCsv(`department_attendance_analytics_${selectedMonth}_${selectedYear}`, headers, departmentData);
  };

  // PDF Export: Gumagawa ng professional PDF document gamit ang jsPDF at autoTable.
  // May official header, corporate branding, data table, summary cards, at signature section ng admin
  const handleExportMonthlyPdf = () => {
    const headers = ['Employee ID', 'Staff Member', 'Department', 'Days Worked', 'On-Time', 'Late Days', 'On Leave', 'Late Mins', 'Hours', 'Compliance'];
    const rows = monthlyData.map(r => [
      r.employeeId,
      r.name,
      r.department,
      `${r.daysWorked} days`,
      r.presentDays,
      r.lateDays,
      `${r.onLeaveDays || 0} days`,
      `${r.totalLateMinutes}m`,
      `${r.totalHours} hrs`,
      `${r.complianceRate}%`
    ]);
    generatePdfDocument({
      title: 'Monthly Attendance Summary Report',
      subtitle: `Official Audit Period: ${selectedMonth}/${selectedYear} • Scope: ${selectedDept === 'All' ? 'Institutional (All Departments)' : currentDeptLabel}`,
      meta: [
        `Reporting Period: ${selectedMonth}/${selectedYear}  |  Department Scope: ${currentDeptLabel}`,
        `Total Audited Workforce: ${monthlyData.length} Staff Members  |  Average Compliance: ${avgCompliance}%`,
        `Administrator & Lead: Ellica Chris Onggoco (Project Director)`
      ],
      headers,
      rows,
      filename: `monthly_attendance_report_${selectedMonth}_${selectedYear}`,
      landscape: true,
      includeSignatures: true
    });
  };

  const handleExportDeptPdf = () => {
    const headers = ['Code', 'Department', 'Department Head', 'Staff', 'Hours Worked', 'Punctuality', 'Approved Leaves', 'Pending Leaves'];
    const rows = departmentData.map(d => [
      d.departmentCode,
      d.departmentName,
      d.managerName,
      d.totalEmployees,
      `${d.totalHoursWorked} hrs`,
      `${d.punctualityRate}%`,
      d.approvedLeaves,
      d.pendingLeaves
    ]);
    generatePdfDocument({
      title: 'Department Attendance & Leave Analytics Report',
      subtitle: `Audit Period: ${selectedMonth}/${selectedYear} • Scope: ${selectedDept === 'All' ? 'Institutional (All Departments Cross-Analysis)' : currentDeptLabel}`,
      meta: [
        `Reporting Period: ${selectedMonth}/${selectedYear}  |  Department Scope: ${currentDeptLabel}`,
        `Audited Departments: ${departmentData.length}  |  Total Monitored Workforce: ${monthlyData.length} Staff`,
        `Generated by: Ellica Chris Onggoco (System Administrator & Project Director)`
      ],
      headers,
      rows,
      filename: `department_analytics_report_${selectedMonth}_${selectedYear}`,
      landscape: true,
      includeSignatures: true
    });
  };

  const totalHoursAll = monthlyData.reduce((sum, item) => sum + item.totalHours, 0);
  const avgCompliance = monthlyData.length > 0 
    ? Math.round(monthlyData.reduce((sum, item) => sum + item.complianceRate, 0) / monthlyData.length)
    : 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto printable-area">
      {/* Official Print Header */}
      <div className="hidden print-only mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">
              AttendEase Workforce Attendance System
            </h1>
            <p className="text-xs text-slate-500">Official Institutional Attendance & Compliance Audit</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p><strong>Generated:</strong> {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
            <p><strong>Administrator:</strong> Ellica Chris Onggoco</p>
          </div>
        </div>

        <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span><strong>Reporting Period:</strong> {selectedMonth}/{selectedYear}</span>
          <span><strong>Department Scope:</strong> {selectedDept === 'All' ? 'Institutional (All Departments)' : selectedDept}</span>
          <span><strong>Active Roster:</strong> {monthlyData.length} Staff</span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Reports & Compliance</h2>
          <p className="text-xs text-slate-500 mt-1">
            Institutional timesheet summaries, punctuality analysis, and formal printable records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={activeTab === 'monthly' ? handleExportMonthlyPdf : handleExportDeptPdf}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
            title="Download official report as formatted PDF"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Download Report (PDF)</span>
          </button>

          <button
            onClick={activeTab === 'monthly' ? handleExportMonthlyCsv : handleExportDeptCsv}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition flex items-center gap-2 cursor-pointer"
            title="Download report data as Excel CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-medium shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="no-print bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'monthly'
                ? 'bg-[#39333B] text-white font-bold shadow-sm border border-[#534757]'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === 'monthly' ? 'text-[#DFC090]' : 'text-slate-400'}`} />
            <span>Report 1: Monthly Attendance Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('department')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'department'
                ? 'bg-[#39333B] text-white font-bold shadow-sm border border-[#534757]'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Building2 className={`w-3.5 h-3.5 ${activeTab === 'department' ? 'text-[#DFC090]' : 'text-slate-400'}`} />
            <span>Report 2: Department Cross-Analytics</span>
          </button>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {[
                { val: '01', name: 'January' },
                { val: '02', name: 'February' },
                { val: '03', name: 'March' },
                { val: '04', name: 'April' },
                { val: '05', name: 'May' },
                { val: '06', name: 'June' },
                { val: '07', name: 'July' },
                { val: '08', name: 'August' },
                { val: '09', name: 'September' },
                { val: '10', name: 'October' },
                { val: '11', name: 'November' },
                { val: '12', name: 'December' },
              ].map((m) => (
                <option key={m.val} value={m.val}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-semibold uppercase text-slate-400">Total Staff</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{monthlyData.length} Members</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-semibold uppercase text-slate-400">Logged Hours</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{totalHoursAll.toFixed(1)} hrs</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-semibold uppercase text-slate-400">Avg Compliance</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{avgCompliance}%</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-semibold uppercase text-slate-400">Audit Status</p>
          <p className="text-xs font-semibold text-emerald-800 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified & Compliant
          </p>
        </div>
      </div>

      {/* Report 1: Monthly Attendance Summary Table */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-xs">
                  Monthly Attendance Summary Report ({selectedMonth}/{selectedYear})
                </h3>
                {selectedDept !== 'All' && (
                  <span className="text-[10px] font-bold text-[#8C6F4B] bg-[#F7F2EC] px-2 py-0.5 rounded-md border border-[#DFC090]/40">
                    Filtered: {currentDeptObj ? currentDeptObj.name : selectedDept}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedDept === 'All'
                  ? 'Full workforce roster timesheet and compliance statistics'
                  : `Active employees assigned to ${currentDeptObj ? currentDeptObj.name : selectedDept}`}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              Institutional Baseline: 22 Working Days
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Days Worked</th>
                  <th className="py-3 px-4 text-center">On-Time</th>
                  <th className="py-3 px-4 text-center">Late</th>
                  <th className="py-3 px-4 text-center">On Leave</th>
                  <th className="py-3 px-4 text-center">Late Minutes</th>
                  <th className="py-3 px-4 text-center">Hours Logged</th>
                  <th className="py-3 px-4 text-center">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Loading statistics...
                    </td>
                  </tr>
                ) : monthlyData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No records found for this period.
                    </td>
                  </tr>
                ) : (
                  monthlyData.map((row) => (
                    <tr key={row.employeeId} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {row.employeeId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {row.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {row.department}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-800">
                        {row.daysWorked} days
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-emerald-700">
                        {row.presentDays}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-amber-700">
                        {row.lateDays}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {row.onLeaveDays > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                            {row.onLeaveDays} day{row.onLeaveDays > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">
                        {row.totalLateMinutes}m
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-900">
                        {row.totalHours} hrs
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight border ${
                          row.complianceRate >= 85 ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60' :
                          row.complianceRate >= 70 ? 'bg-amber-50/70 text-amber-800 border-amber-200/60' :
                          'bg-rose-50/70 text-rose-800 border-rose-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            row.complianceRate >= 85 ? 'bg-emerald-500' :
                            row.complianceRate >= 70 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}></span>
                          {row.complianceRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Department Attendance Analytics */}
      {activeTab === 'department' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-xs">
                  Department Attendance & Leave Analytics Report
                </h3>
                {selectedDept !== 'All' ? (
                  <span className="text-[10px] font-bold text-[#8C6F4B] bg-[#F7F2EC] px-2 py-0.5 rounded-md border border-[#DFC090]/40">
                    Filtered: {currentDeptObj ? currentDeptObj.name : selectedDept}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    All Departments Cross-Analysis
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {selectedDept === 'All'
                  ? 'Institutional cross-analysis comparing punctuality, logged hours, and leaves across all departments'
                  : `Dedicated department performance audit for ${currentDeptObj ? currentDeptObj.name : selectedDept}`}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">
              Audit Period: {selectedMonth}/{selectedYear}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Lead</th>
                  <th className="py-3 px-4 text-center">Assigned Staff</th>
                  <th className="py-3 px-4 text-center">Hours Worked</th>
                  <th className="py-3 px-4 text-center">Punctuality %</th>
                  <th className="py-3 px-4 text-center">Approved Leaves</th>
                  <th className="py-3 px-4 text-center">Pending Leaves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentData.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {dept.departmentCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {dept.departmentName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {dept.managerName}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-800">
                      {dept.totalEmployees}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-900">
                      {dept.totalHoursWorked} hrs
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight bg-emerald-50/70 text-emerald-800 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {dept.punctualityRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {dept.approvedLeaves}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-amber-700">
                      {dept.pendingLeaves}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Sign-off on Print */}
      <div className="hidden print-only mt-12 pt-8 border-t-2 border-slate-300">
        <p className="text-xs text-slate-500 mb-8 italic">
          Certified institutional attendance record submitted for final evaluation. Signatures below attest to data verification.
        </p>

        <div className="grid grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-slate-900 pb-1 mb-1 font-semibold text-slate-900">
              Ellica Chris Onggoco
            </div>
            <p className="text-slate-500">Group Leader & System Admin</p>
          </div>

          <div>
            <div className="border-b border-slate-900 pb-1 mb-1 font-semibold text-slate-900">
              John Herzsel Datul
            </div>
            <p className="text-slate-500">Lead Systems Architect</p>
          </div>

          <div>
            <div className="border-b border-slate-900 pb-1 mb-1 font-semibold text-slate-900">
              __________________________________
            </div>
            <p className="text-slate-500">Project Evaluator / Instructor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
