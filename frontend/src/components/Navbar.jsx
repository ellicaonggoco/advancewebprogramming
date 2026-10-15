import React, { useState, useEffect } from 'react';
import { Menu, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick, title = "Dashboard" }) {
  const { user, isAdmin } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = time.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-[#E8E1EA] px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#39333B] tracking-tight">{title}</h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">Employee Attendance Management System</p>
          </div>
        </div>

        {/* Right: Live Clock & Role Tag */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 font-mono font-medium text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedTime}</span>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-tight ${
            isAdmin 
              ? 'bg-[#39333B] text-[#F5E6CC] border border-[#DFC090]/40 shadow-xs' 
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isAdmin ? 'text-[#DFC090]' : 'text-slate-500'}`} />
            <span className="capitalize">{user?.role === 'admin' ? 'Leader / Admin' : 'Staff'}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
