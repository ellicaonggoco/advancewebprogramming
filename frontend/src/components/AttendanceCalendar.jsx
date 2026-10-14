import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  Coffee, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  CalendarCheck2
} from 'lucide-react';
import { getHoliday } from '../utils/holidays';
import StatusBadge from './StatusBadge';

export default function AttendanceCalendar({ 
  attendance = [], 
  leaves = [], 
  employees = [],
  targetEmployee = null,
  isAdmin = false 
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(2026, 9, 15)); // Default to Oct 2026 test month or current

  // Selected employee for viewing their calendar
  const initialEmpId = targetEmployee?.id || targetEmployee?._id || (employees[0]?.id || employees[0]?._id || '');
  const [selectedEmpId, setSelectedEmpId] = useState(initialEmpId);

  useEffect(() => {
    if (targetEmployee) {
      setSelectedEmpId(targetEmployee.id || targetEmployee._id);
    } else if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id || employees[0]._id);
    }
  }, [targetEmployee, employees]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Filter attendance & leaves strictly for the viewed employee
  const currentEmpAttendance = attendance.filter(a => {
    if (!a.employee) return false;
    const empId = typeof a.employee === 'string' ? a.employee : (a.employee.id || a.employee._id);
    const empCode = typeof a.employee === 'object' ? a.employee.employeeId : null;
    return selectedEmpId ? (empId === selectedEmpId || empCode === selectedEmpId) : true;
  });

  const currentEmpLeaves = leaves.filter(l => {
    if (!l.employee) return false;
    const empId = typeof l.employee === 'string' ? l.employee : (l.employee.id || l.employee._id);
    const empCode = typeof l.employee === 'object' ? l.employee.employeeId : null;
    return selectedEmpId ? (empId === selectedEmpId || empCode === selectedEmpId) : true;
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setViewDate(new Date());
  };

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Create array of day dates
  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    daysArray.push(d);
  }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (dayNum) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  };

  // Compute month statistics strictly for this employee
  let countPresent = 0;
  let countLate = 0;
  let countHalfDay = 0;
  let countUndertime = 0;
  let countIncomplete = 0;
  let countAbsent = 0;
  let countOnLeave = 0;
  let countRestDays = 0;
  let countHolidays = 0;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dStr = formatDateStr(d);
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = getHoliday(dStr);

    if (holiday) countHolidays++;
    if (isWeekend) countRestDays++;

    // Find attendance record for viewed employee
    const rec = currentEmpAttendance.find(a => a.date === dStr);
    const leaveRec = currentEmpLeaves.find(l => {
      return l.status === 'Approved' && l.startDate <= dStr && l.endDate >= dStr;
    });

    if (rec) {
      if (rec.status === 'Present') countPresent++;
      else if (rec.status === 'Late') countLate++;
      else if (rec.status === 'Half-Day') countHalfDay++;
      else if (rec.status === 'Undertime') countUndertime++;
      else if (rec.status === 'Incomplete Shift') countIncomplete++;
      else if (rec.status === 'On Leave') countOnLeave++;
      else if (rec.status === 'Absent') countAbsent++;
    } else if (leaveRec) {
      countOnLeave++;
    } else {
      // If it's a past weekday (before or equal to today) and NOT a weekend and NOT a holiday
      if (!isWeekend && !holiday && dStr < todayStr) {
        countAbsent++;
      }
    }
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Month Navigation & Title */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#39333B] to-[#252028] text-[#DFC090] flex items-center justify-center shadow-sm">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <span>{monthNames[month]} {year}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold border border-zinc-200">
                Attendance Calendar
              </span>
            </h3>
            <p className="text-xs text-zinc-500">
              Interactive monthly shift schedule, rest days, holidays, and punctuality audit.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {isAdmin && employees.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Viewing Staff:</span>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
              >
                {employees.map(emp => (
                  <option key={emp.id || emp._id} value={emp.id || emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={jumpToToday}
            className="px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium transition cursor-pointer"
          >
            Current Month
          </button>
          <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs">
            <button
              onClick={prevMonth}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer border-r border-zinc-200"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Counters Bar for Viewed Month */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
          <span className="block text-[10px] uppercase font-bold text-emerald-800">Whole Day</span>
          <span className="text-lg font-extrabold text-emerald-900">{countPresent}</span>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center">
          <span className="block text-[10px] uppercase font-bold text-amber-800">Late</span>
          <span className="text-lg font-extrabold text-amber-900">{countLate}</span>
        </div>
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-center">
          <span className="block text-[10px] uppercase font-bold text-blue-800">Half-Day</span>
          <span className="text-lg font-extrabold text-blue-900">{countHalfDay}</span>
        </div>
        <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 text-center">
          <span className="block text-[10px] uppercase font-bold text-orange-800">Undertime</span>
          <span className="text-lg font-extrabold text-orange-900">{countUndertime}</span>
        </div>
        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 text-center">
          <span className="block text-[10px] uppercase font-bold text-rose-800">Incomplete</span>
          <span className="text-lg font-extrabold text-rose-900">{countIncomplete}</span>
        </div>
        <div className="p-3 rounded-xl bg-red-50/70 border border-red-200/80 text-center">
          <span className="block text-[10px] uppercase font-bold text-red-800">Absent</span>
          <span className="text-lg font-extrabold text-red-900">{countAbsent}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-700">Rest Days</span>
          <span className="text-lg font-extrabold text-slate-800">{countRestDays}</span>
        </div>
        <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-center">
          <span className="block text-[10px] uppercase font-bold text-amber-900">Holidays</span>
          <span className="text-lg font-extrabold text-amber-950">{countHolidays}</span>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="bg-white rounded-xl p-3.5 border border-zinc-200/80 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-zinc-700 text-[11px] uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 text-[#DFC090]" />
          <span>Status Legend:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-zinc-700 font-medium">Whole Day (&ge;7.5h)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-zinc-700 font-medium">Late Arrival</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-zinc-700 font-medium">Half-Day (4h - 7.5h)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span className="text-zinc-700 font-medium">Undertime (&lt;4h)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-zinc-700 font-medium">Incomplete / Invalid (&lt;1h)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span className="text-zinc-700 font-medium">Absent (No Record)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="text-zinc-700 font-medium">Rest Day (Weekend)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-zinc-700 font-medium">Official Holiday</span>
          </span>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-bold text-zinc-600">
          <div className="py-3 text-rose-700 bg-rose-50/30">Sun (Rest Day)</div>
          <div className="py-3">Mon</div>
          <div className="py-3">Tue</div>
          <div className="py-3">Wed</div>
          <div className="py-3">Thu</div>
          <div className="py-3">Fri</div>
          <div className="py-3 text-rose-700 bg-rose-50/30">Sat (Rest Day)</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-200/80">
          {daysArray.map((dayNum, idx) => {
            if (!dayNum) {
              return <div key={`empty-${idx}`} className="min-h-[105px] bg-zinc-50/40"></div>;
            }

            const dateStr = formatDateStr(dayNum);
            const dayOfWeek = new Date(year, month, dayNum).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = dateStr === todayStr;
            const holiday = getHoliday(dateStr);

            // Find attendance record for this day (scoped to viewed employee)
            const rec = currentEmpAttendance.find(a => a.date === dateStr);

            // Check if on approved leave
            const leaveRec = currentEmpLeaves.find(l => {
              return l.status === 'Approved' && l.startDate <= dateStr && l.endDate >= dateStr;
            });

            const isPastWorkday = !isWeekend && !holiday && dateStr < todayStr && !rec && !leaveRec;
            const isFuture = dateStr > todayStr;

            return (
              <div 
                key={dateStr}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors relative ${
                  isToday 
                    ? 'bg-amber-50/20 ring-2 ring-inset ring-[#DFC090]' 
                    : isWeekend 
                    ? 'bg-slate-100/60' 
                    : holiday 
                    ? 'bg-amber-50/40' 
                    : 'bg-white hover:bg-zinc-50/60'
                }`}
              >
                {/* Day Header: Date Number & Badges */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${
                      isToday 
                        ? 'bg-zinc-900 text-white shadow-xs' 
                        : isWeekend 
                        ? 'text-zinc-600 bg-slate-200/80' 
                        : holiday
                        ? 'text-amber-900 bg-amber-200 font-extrabold'
                        : 'text-zinc-800'
                    }`}>
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-extrabold uppercase text-[#b38b4c] tracking-wider">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Rest Day Indicator */}
                  {isWeekend && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/90 text-slate-700 tracking-tight">
                      <Coffee className="w-2.5 h-2.5 text-slate-500" />
                      <span>Rest Day</span>
                    </span>
                  )}
                </div>

                {/* Holiday Banner if Applicable */}
                {holiday && (
                  <div className="my-1 px-1.5 py-1 rounded-md bg-amber-100/90 border border-amber-300 text-[10px] text-amber-950 font-bold leading-tight flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />
                    <span className="truncate" title={holiday.name}>{holiday.name}</span>
                  </div>
                )}

                {/* Day Attendance Content */}
                <div className="mt-1 space-y-1">
                  {rec ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={rec.status} lateMinutes={rec.lateMinutes} />
                        {rec.workHours !== undefined && (
                          <span className="text-[10px] font-mono font-bold text-zinc-700">
                            {rec.workHours}h
                          </span>
                        )}
                      </div>

                      {/* Timestamps */}
                      {rec.timeIn && (
                        <div className="text-[10px] text-zinc-600 font-mono bg-zinc-100/70 p-1 rounded border border-zinc-200/60 leading-tight">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400">In:</span>
                            <span className="font-semibold text-zinc-800">{rec.timeIn}</span>
                          </div>
                          {rec.timeOut ? (
                            <div className="flex items-center justify-between mt-0.5 border-t border-zinc-200/50 pt-0.5">
                              <span className="text-zinc-400">Out:</span>
                              <span className="font-semibold text-zinc-800">{rec.timeOut}</span>
                            </div>
                          ) : (
                            <div className="text-emerald-600 font-sans font-medium text-[9px] mt-0.5">
                              ● On shift now
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : leaveRec ? (
                    <div className="p-1 rounded bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-medium leading-tight">
                      <span className="font-bold">On Leave:</span> {leaveRec.leaveType}
                    </div>
                  ) : isPastWorkday ? (
                    <div className="p-1.5 rounded-md bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] font-bold leading-tight flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>Absent (No Punch)</span>
                    </div>
                  ) : isFuture && !isWeekend && !holiday ? (
                    <div className="text-[10px] text-zinc-400 italic">
                      Scheduled Shift
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
