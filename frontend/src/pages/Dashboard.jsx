import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  CalendarOff, 
  ChevronRight,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import TimeClockWidget from '../components/TimeClockWidget';
import StatusBadge from '../components/StatusBadge';
import UserAvatar from '../components/UserAvatar';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
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
            <Link
              to="/employees"
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
            subtitle={`${stats?.activeEmployees || 0} verified active`}
            icon={Users}
            color="slate"
            badge="Verified"
            badgeType="neutral"
          />

          <StatCard
            title="Present Today"
            value={today.present}
            subtitle="On-time shift arrival"
            icon={UserCheck}
            color="slate"
            badge={`${today.present} Present`}
            badgeType="success"
          />

          <StatCard
            title="Late Today"
            value={today.late}
            subtitle="Past 9:00 AM grace period"
            icon={Clock}
            color="slate"
            badge={today.late > 0 ? "Requires review" : "On schedule"}
            badgeType={today.late > 0 ? "warning" : "success"}
          />

          <StatCard
            title="On Approved Leave"
            value={today.onLeave}
            subtitle={`${stats?.pendingLeaves || 0} pending applications`}
            icon={CalendarOff}
            color="slate"
            badge={`${today.onLeave} Out of Office`}
            badgeType="neutral"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Shift Schedule"
            value={stats?.employeeStats?.shift || '09:00 AM - 06:00 PM'}
            subtitle="Assigned Working Shift"
            icon={Clock}
            color="slate"
            badge="Standard Shift"
            badgeType="neutral"
          />

          <StatCard
            title="Days Present"
            value={`${stats?.employeeStats?.presentDays ?? 0} Days`}
            subtitle="Recorded this month"
            icon={UserCheck}
            color="slate"
            badge={`${stats?.employeeStats?.onTimeRate ?? 100}% Punctual`}
            badgeType="success"
          />

          <StatCard
            title="Shift Deviations"
            value={`${stats?.employeeStats?.lateDays ?? 0} Late`}
            subtitle="15-min grace window"
            icon={Clock}
            color="slate"
            badge={(stats?.employeeStats?.lateDays || 0) > 0 ? "Review log" : "On schedule"}
            badgeType={(stats?.employeeStats?.lateDays || 0) > 0 ? "warning" : "success"}
          />

          <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-zinc-300 transition-all duration-150 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-500 tracking-tight">Leave Balance</span>
              <CalendarOff className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
            </div>

            <div className="mt-2.5 mb-2 flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                {stats?.employeeStats?.leaveBalance ?? 15} Days
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {stats?.employeeStats?.approvedLeaves || 0} Approved
              </span>
            </div>

            <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-400 text-[11px] font-normal">
                {stats?.employeeStats?.pendingLeaves || 0} pending
              </span>
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
    </div>
  );
}
