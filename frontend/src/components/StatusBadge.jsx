import React from 'react';

// StatusBadge: Dito natin kino-convert ang status code papuntang magandang visual badge na may tamang kulay at label.
// Tinitingnan din nito kung may time-out na o kasalukuyang 'On Duty' pa ang empleyado para hindi maging misleading
// (halimbawa: hindi 'Whole Day' agad kung 8:52 AM pa lang nag-time in at wala pang time-out).
export default function StatusBadge({ status, lateMinutes, timeIn, timeOut, workHours, size = 'sm' }) {
  const configs = {
    Present: {
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-800',
      border: 'border-emerald-200/60',
      label: 'Present',
    },
    Late: {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50/70',
      text: 'text-amber-800',
      border: 'border-amber-200/60',
      label: lateMinutes ? `Late (+${lateMinutes}m)` : 'Late',
    },
    'Half-Day': {
      dot: 'bg-blue-500',
      bg: 'bg-blue-50/70',
      text: 'text-blue-800',
      border: 'border-blue-200/60',
      label: 'Half-Day (4h+)',
    },
    Undertime: {
      dot: 'bg-orange-500',
      bg: 'bg-orange-50/70',
      text: 'text-orange-800',
      border: 'border-orange-200/60',
      label: 'Undertime (<4h)',
    },
    'Incomplete Shift': {
      dot: 'bg-rose-500',
      bg: 'bg-rose-50/70',
      text: 'text-rose-800',
      border: 'border-rose-200/60',
      label: 'Incomplete (<1h)',
    },
    'Rest Day': {
      dot: 'bg-slate-400',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      label: 'Rest Day (Off)',
    },
    Holiday: {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      label: 'Official Holiday',
    },
    'On Leave': {
      dot: 'bg-sky-500',
      bg: 'bg-sky-50/70',
      text: 'text-sky-800',
      border: 'border-sky-200/60',
      label: 'On Leave',
    },
    Overtime: {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50/80',
      text: 'text-amber-900',
      border: 'border-amber-200',
      label: 'Overtime (OT)',
    },
    Absent: {
      dot: 'bg-rose-500',
      bg: 'bg-rose-50/70',
      text: 'text-rose-800',
      border: 'border-rose-200/60',
      label: 'Absent',
    },
    Approved: {
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-800',
      border: 'border-emerald-200/60',
      label: 'Approved',
    },
    Pending: {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50/70',
      text: 'text-amber-800',
      border: 'border-amber-200/60',
      label: 'Pending',
    },
    Rejected: {
      dot: 'bg-rose-500',
      bg: 'bg-rose-50/70',
      text: 'text-rose-800',
      border: 'border-rose-200/60',
      label: 'Rejected',
    },
    Active: {
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-800',
      border: 'border-emerald-200/60',
      label: 'Active',
    },
    Terminated: {
      dot: 'bg-slate-400',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      label: 'Terminated',
    }
  };

  const config = configs[status] || {
    dot: 'bg-slate-400',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: status,
  };

  let dynamicLabel = config.label;
  let isPulsing = false;

  // Real-time Shift Logic:
  // Kapag may timeIn pero WALA PANG timeOut (o '-' pa lang), ibig sabihin kasalukuyan pa siyang naka-duty sa opisina
  const hasNoTimeOut = !timeOut || timeOut === '-' || timeOut === 'null';

  if (status === 'Present') {
    if (timeIn && hasNoTimeOut) {
      dynamicLabel = 'Present (On Duty)';
      isPulsing = true;
    } else if (timeOut && !hasNoTimeOut) {
      dynamicLabel = 'Present (Full Day)';
    } else {
      dynamicLabel = 'Present';
    }
  } else if (status === 'Late') {
    if (timeIn && hasNoTimeOut) {
      dynamicLabel = lateMinutes ? `Late - On Duty (+${lateMinutes}m)` : 'Late (On Duty)';
      isPulsing = true;
    } else {
      dynamicLabel = lateMinutes ? `Late (+${lateMinutes}m)` : 'Late';
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-tight border ${config.bg} ${config.text} ${config.border} shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-nowrap select-none`}
    >
      {isPulsing ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`}></span>
      )}
      <span>{dynamicLabel}</span>
    </span>
  );
}
