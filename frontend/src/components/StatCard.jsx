import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  badge,
  badgeType = "neutral" 
}) {
  return (
    <div className="p-5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-zinc-300 transition-all duration-150 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 tracking-tight">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-zinc-400 stroke-[1.75]" />}
      </div>

      <div className="mt-2.5 mb-3">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
          {value}
        </div>
      </div>

      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
        <span className="text-zinc-400 text-[11px] font-normal">{subtitle}</span>
        {badge && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-tight ${
            badgeType === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
            badgeType === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
            badgeType === 'danger' ? 'bg-rose-50 text-rose-700 border border-rose-200/50' :
            'bg-zinc-100 text-zinc-600 border border-zinc-200/60'
          }`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
