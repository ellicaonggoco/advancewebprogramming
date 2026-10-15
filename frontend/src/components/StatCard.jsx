import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  badge,
  badgeType = "neutral",
  className = ""
}) {
  return (
    <div className={`p-5 rounded-xl bg-white border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-zinc-300 transition-all duration-150 flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 tracking-tight">{title}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-500">
            <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
          </div>
        )}
      </div>

      <div className="mt-2 mb-3">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
          {value}
        </div>
      </div>

      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
        <div className="text-zinc-500 text-[11px] font-normal flex items-center gap-1.5">
          {subtitle}
        </div>
        {badge && (
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium tracking-tight ${
            badgeType === 'success' ? 'text-emerald-700' :
            badgeType === 'warning' ? 'text-amber-700' :
            badgeType === 'danger' ? 'text-rose-700' :
            'text-zinc-500'
          }`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
