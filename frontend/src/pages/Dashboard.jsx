import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  CalendarOff, 
  ChevronRight,
  Calendar,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api, getLocalDateString } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import TimeClockWidget from '../components/TimeClockWidget';
import StatusBadge from '../components/StatusBadge';
import UserAvatar from '../components/UserAvatar';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Overtime Mandate State (Admin Quick Action)
  const [otModalOpen, setOtModalOpen] = useState(false);
  const [otForm, setOtForm] = useState({
    employeeId: '',
    reason: 'Approved Operational Duty / Project Sprint',
    allEmployees: false,
    maxHours: 4
  });
  const [otLoading, setOtLoading] = useState(false);
  const [otSuccess, setOtSuccess] = useState('');
  const [otError, setOtError] = useState('');

  const loadDashboardData = async () => {
    try {
      const [res, empRes] = await Promise.all([
        api.getDashboardStats(),
        api.getEmployees().catch(() => ({ success: false }))
      ]);

      if (res.success) {
        setStats(res.stats);
      }
      if (empRes?.success && empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeOt = async (e) => {
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
      await loadDashboardData();
      setTimeout(() => {
        setOtModalOpen(false);
        setOtSuccess('');
      }, 1400);
    } catch (err) {
      setOtError(err.message || 'Failed to authorize overtime');
    } finally {
      setOtLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Retrieving workplace metrics...</p>
        </div>
      </div>
    );
  }

  const today = stats?.today || { present: 0, late: 0, halfDay: 0, onLeave: 0, absent: 0, attendanceRate: 0 };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Good day, {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.username}
            </h2>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {user?.role === 'admin' ? 'System Administrator' : 'Staff Member'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin 
              ? 'Institutional workforce attendance, daily shift monitoring, and departmental statistics.' 
              : 'Review your shift hours, record daily time-in/out, and manage leave requests.'}
          </p>
        </div>

        {/* Quick Actions (Admin only) */}
        {isAdmin && (
          <div className="flex items-center gap-2.5">
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
                setOtModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              title="Admin: Mandate and authorize employee for overtime duty"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-950" />
              <span>Authorize Overtime</span>
            </button>

            <Link
              to="/employees?action=new"
              className="px-4 py-2 rounded-xl bg-[#39333B] hover:bg-[#463C4A] text-white text-xs font-medium shadow-sm transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </Link>
          </div>
        )}
      </div>

      {/* Time Clock In/Out Widget */}
      <TimeClockWidget onClockEvent={loadDashboardData} />

      {/* KPI Cards Grid */}
      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Workforce"
            value={stats?.totalEmployees || 0}
            subtitle={
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                <span>{stats?.activeEmployees || 0} active employees enrolled</span>
              </span>
            }
            icon={Users}
          />

          <StatCard
            title="Present Today"
            value={(today.present || 0) + (today.late || 0) + (today.halfDay || 0)}
            subtitle={
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{today.present || 0} on-time{(today.late || 0) > 0 ? ` • ${today.late} late` : ''}</span>
              </span>
            }
            icon={UserCheck}
          />

          <StatCard
            title="Late Today"
            value={today.late}
            subtitle={
              today.late > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Requires supervisor review</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>All arrivals on schedule</span>
                </span>
              )
            }
            icon={Clock}
          />

          <StatCard
            title="On Approved Leave"
            value={today.onLeave}
            subtitle={
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>{stats?.pendingLeaves || 0} pending applications</span>
              </span>
            }
            icon={CalendarOff}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Shift Schedule"
            value={stats?.employeeStats?.shift || '09:00 AM - 06:00 PM'}
            subtitle={
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                <span>Assigned working shift (8h)</span>
              </span>
            }
            icon={Clock}
          />

          {/* Dito kinukuha ang 'Days Present':
              Pumasok pa rin si employee kahit na-late siya, kaya ina-add up dito ang On-Time + Late Days + Half-Days para accurate ang total days present */}
          <StatCard
            title="Days Present"
            value={`${stats?.employeeStats?.totalPresentDays ?? stats?.employeeStats?.daysWorked ?? ((stats?.employeeStats?.presentDays || 0) + (stats?.employeeStats?.lateDays || 0) + (stats?.employeeStats?.halfDays || 0))} Days`}
            subtitle={
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{stats?.employeeStats?.presentDays ?? 0} on-time ({stats?.employeeStats?.onTimeRate ?? 100}% punctuality)</span>
              </span>
            }
            icon={UserCheck}
          />

          <StatCard
            title="Shift Deviations"
            value={`${stats?.employeeStats?.lateDays ?? 0} Late`}
            subtitle={
              (stats?.employeeStats?.lateDays || 0) > 0 ? (
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>15-min grace window applied</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>On schedule this month</span>
                </span>
              )
            }
            icon={Clock}
          />

          <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-zinc-300 transition-all duration-150 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-500 tracking-tight">Leave Balance</span>
              <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-500">
                <CalendarOff className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
            </div>

            <div className="mt-2 mb-3">
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                {stats?.employeeStats?.leaveBalance ?? 15} Days
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-normal">Available annual PTO allocation</p>
            </div>

            <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
                <span>{stats?.employeeStats?.approvedLeaves || 0} used</span>
                <span className="text-zinc-300">•</span>
                <span>{stats?.employeeStats?.pendingLeaves || 0} pending</span>
              </div>
              <Link
                to="/leaves?action=apply"
                className="px-2.5 py-1 rounded-lg bg-[#39333B] hover:bg-[#483F4B] text-[#DFC090] hover:text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Apply for a new leave"
              >
                <span>Apply for Leave</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Compliance Rate Bar */}
      {isAdmin ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Today’s Attendance Compliance</h3>
                <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {today.attendanceRate}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Calculated as checked-in staff versus active roster</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Present ({today.present})
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Late ({today.late})
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span> Half-Day ({today.halfDay})
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> On Leave ({today.onLeave})
              </span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            {stats?.activeEmployees > 0 && (
              <>
                <div 
                  style={{ width: `${(today.present / stats.activeEmployees) * 100}%` }} 
                  className="bg-emerald-600 h-full"
                />
                <div 
                  style={{ width: `${(today.late / stats.activeEmployees) * 100}%` }} 
                  className="bg-amber-500 h-full"
                />
                <div 
                  style={{ width: `${(today.halfDay / stats.activeEmployees) * 100}%` }} 
                  className="bg-slate-500 h-full"
                />
                <div 
                  style={{ width: `${(today.onLeave / stats.activeEmployees) * 100}%` }} 
                  className="bg-slate-300 h-full"
                />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Personal Attendance Performance</h3>
                <span className="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {stats?.employeeStats?.onTimeRate ?? 100}% Punctuality
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Calculated based on your recorded shifts for the current month</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> On-Time ({stats?.employeeStats?.presentDays ?? 0})
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Late ({stats?.employeeStats?.lateDays ?? 0})
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span> Half-Day ({stats?.employeeStats?.halfDays ?? 0})
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> Approved Leaves ({stats?.employeeStats?.approvedLeaves ?? 0})
              </span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            {(stats?.employeeStats?.totalWorkingLogs || 1) > 0 && (
              <>
                <div 
                  style={{ width: `${((stats?.employeeStats?.presentDays || 0) / Math.max(1, stats?.employeeStats?.totalWorkingLogs || 1)) * 100}%` }} 
                  className="bg-emerald-600 h-full"
                />
                <div 
                  style={{ width: `${((stats?.employeeStats?.lateDays || 0) / Math.max(1, stats?.employeeStats?.totalWorkingLogs || 1)) * 100}%` }} 
                  className="bg-amber-500 h-full"
                />
                <div 
                  style={{ width: `${((stats?.employeeStats?.halfDays || 0) / Math.max(1, stats?.employeeStats?.totalWorkingLogs || 1)) * 100}%` }} 
                  className="bg-slate-500 h-full"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Grid: Activity Feed & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isAdmin ? 'Today’s Live Attendance Activity' : 'My Recent Attendance History'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAdmin ? 'Real-time check-in logs and status timestamps' : 'Your recent check-in recordings and status timestamps'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/attendance?tab=calendar"
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="View Monthly Attendance Calendar with Holidays & Rest Days"
                >
                  <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Calendar</span>
                </Link>

                <Link
                  to="/attendance?tab=logs"
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAdmin ? 'View Full Log' : 'View My Logs'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                      {isAdmin ? (
                        <>
                          <th className="pb-2.5 font-semibold">Staff Member</th>
                          <th className="pb-2.5 font-semibold">Department</th>
                          <th className="pb-2.5 font-semibold">Time In</th>
                          <th className="pb-2.5 font-semibold">Status</th>
                          <th className="pb-2.5 font-semibold">Notes</th>
                        </>
                      ) : (
                        <>
                          <th className="pb-2.5 font-semibold">Date</th>
                          <th className="pb-2.5 font-semibold">Time In</th>
                          <th className="pb-2.5 font-semibold">Time Out</th>
                          <th className="pb-2.5 font-semibold">Status</th>
                          <th className="pb-2.5 font-semibold">Method / Notes</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentActivity.map((rec) => {
                      const staffName = rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : 'Staff Member';
                      return (
                        <tr key={rec.id || rec._id} className="hover:bg-slate-50/60 transition">
                          {isAdmin ? (
                            <>
                              <td className="py-3 font-medium text-slate-900 flex items-center gap-2.5">
                                <UserAvatar name={staffName} avatar={rec.employee?.avatar} size="sm" />
                                <div>
                                  <p className="font-semibold text-slate-900 text-xs">{staffName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{rec.employee?.employeeId}</p>
                                </div>
                              </td>
                              <td className="py-3 text-slate-600 text-xs">{rec.employee?.department?.name || 'Department'}</td>
                              <td className="py-3 font-mono font-medium text-slate-800 text-xs">{rec.timeIn || '—'}</td>
                              <td className="py-3">
                                <StatusBadge status={rec.status} lateMinutes={rec.lateMinutes} />
                              </td>
                              <td className="py-3 text-slate-500 text-xs max-w-xs truncate">{rec.notes || 'Normal entry'}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 font-mono font-medium text-slate-800 text-xs whitespace-nowrap">{rec.date}</td>
                              <td className="py-3 font-mono text-slate-800 text-xs whitespace-nowrap">{rec.timeIn || '—'}</td>
                              <td className="py-3 font-mono text-slate-800 text-xs whitespace-nowrap">{rec.timeOut || '—'}</td>
                              <td className="py-3 whitespace-nowrap">
                                <StatusBadge status={rec.status} lateMinutes={rec.lateMinutes} />
                              </td>
                              <td className="py-3 text-slate-500 text-xs max-w-xs truncate">{rec.notes || rec.method || 'Institutional time-in'}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                {isAdmin ? 'No check-in records for today yet.' : 'No recent attendance entries recorded yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Department Distribution (Admin) OR Shift Guidelines (Staff) */}
        {isAdmin ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Departments</h3>
                  <p className="text-[11px] text-slate-400">Workforce distribution</p>
                </div>

                <Link
                  to="/departments"
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {stats?.departmentStats?.map((dept) => {
                  const percentage = stats.totalEmployees > 0 
                    ? Math.round((dept.employeeCount / stats.totalEmployees) * 100) 
                    : 0;

                  return (
                    <div key={dept.id || dept.code} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-800">{dept.name}</span>
                        <span className="font-medium text-slate-600">{dept.employeeCount} staff</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${percentage}%` }}
                          className="bg-slate-800 h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Organizational Units</span>
              <span className="font-semibold text-slate-800">{stats?.totalDepartments || 0} Total</span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Shift & Policy Guidelines</h3>
                  <p className="text-[11px] text-slate-400">Workplace attendance standards</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-800 mb-0.5">Core Working Hours</p>
                  <p className="text-slate-600 font-mono text-[11px]">{stats?.employeeStats?.shift || '09:00 AM – 06:00 PM'} (8.0 Hours)</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-800 mb-0.5">Arrival Grace Period</p>
                  <p className="text-slate-600 text-[11px]">15 minutes allowed (Arrival by 09:15 AM counted as on-time).</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-800 mb-0.5">Designated Break</p>
                  <p className="text-slate-600 text-[11px]">12:00 PM – 01:00 PM (1 Hour Mandatory Lunch Break).</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                  <p className="font-semibold text-slate-800 mb-0.5">Assigned Department</p>
                  <p className="text-slate-600 text-[11px]">{user?.employee?.department?.name || 'General Operations'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Shift Compliance Status</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Compliant</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Overtime Authorization Modal */}
      {isAdmin && otModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Authorize Staff Overtime</h3>
                  <p className="text-[11px] text-zinc-500">Official permission for employee overtime duty today</p>
                </div>
              </div>
              <button
                onClick={() => setOtModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {otSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{otSuccess}</span>
              </div>
            )}

            {otError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{otError}</span>
              </div>
            )}

            <form onSubmit={handleAuthorizeOt} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Pahintulot ng Administrasyon (Admin Mandate Required)
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
                  onClick={() => setOtModalOpen(false)}
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
