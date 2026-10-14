import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Settings as SettingsIcon,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';
import AppLogo from './AppLogo';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: isAdmin ? 'Attendance Records' : 'My Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Employee Directory', path: '/employees', icon: Users, adminOnly: true },
    { name: 'Departments', path: '/departments', icon: Building2, adminOnly: true },
    { name: isAdmin ? 'Leave Requests' : 'My Leave Requests', path: '/leaves', icon: FileText },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'Profile Settings', path: '/settings', icon: SettingsIcon },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  const content = (
    <div className="flex flex-col h-full bg-[#2A252C] text-[#E8E1EA] select-none border-r border-[#3E3641]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#3E3641] flex items-center justify-between">
        <AppLogo size="md" inverted={true} />

        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-[#E8E0EB] hover:text-white hover:bg-[#4E3953] lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#DFC090]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFC090] shadow-[0_0_8px_#DFC090]" />
          <span>Navigation</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer
                ${isActive 
                  ? 'bg-gradient-to-r from-[#4E3953] to-[#3C2A3F] text-white font-bold border border-[#76567B] shadow-md shadow-black/30' 
                  : 'text-[#E8E0EB] hover:text-white hover:bg-[#3D2E42] hover:translate-x-1 font-medium'}
              `}
            >
              {({ isActive }) => (
                <>
                  {/* Left luminous accent bar when active */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-[#DFC090] shadow-[0_0_8px_#DFC090]" />
                  )}

                  <Icon 
                    className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                      isActive 
                        ? 'text-[#DFC090] drop-shadow-sm scale-110' 
                        : 'text-[#C9BDCE] group-hover:text-[#DFC090] group-hover:scale-105'
                    }`} 
                  />

                  <span className="flex-1 truncate">{item.name}</span>

                  {/* Right glowing jewel indicator when active */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DFC090] shrink-0 shadow-[0_0_8px_#DFC090]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#3E3641] bg-[#1B161C]/80">
        <div 
          onClick={() => {
            navigate('/settings');
            if (mobileOpen && setMobileOpen) setMobileOpen(false);
          }}
          className="flex items-center gap-3 mb-3 p-1.5 -m-1.5 rounded-xl hover:bg-[#382C3D] transition-colors cursor-pointer group"
          title="Click to view & edit Profile Settings"
        >
          <UserAvatar 
            name={user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.username} 
            avatar={user?.avatar || user?.employee?.avatar}
            size="md"
            className="border-[#5E4761] ring-1 ring-[#DFC090]/25 group-hover:ring-[#DFC090]/60 transition"
          />

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate group-hover:text-[#DFC090] transition flex items-center justify-between">
              <span className="truncate">{user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.username}</span>
              <SettingsIcon className="w-3.5 h-3.5 text-[#C9BDCE] opacity-0 group-hover:opacity-100 transition shrink-0 ml-1" />
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isAdmin 
                  ? 'bg-[#DFC090]/20 text-[#F5E6CC] border border-[#DFC090]/40 shadow-xs' 
                  : 'bg-[#48374D] text-[#E8E0EB] border border-[#6E5573]'
              }`}>
                {isAdmin ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[#DFC090]" />
                    <span>Leader / Admin</span>
                  </>
                ) : (
                  <span>Staff Member</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#E8E0EB] hover:text-rose-200 hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer border border-[#48374D] hover:border-rose-900/50"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-300" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#2A252C] shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
