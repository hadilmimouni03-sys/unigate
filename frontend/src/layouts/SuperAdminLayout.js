import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';

const ShieldIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const DashIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const BuildingIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4"/></svg>;
const UsersIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v2l2 1"/></svg>;
const BellIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
const LogoutIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;

const NAV_ITEMS = [
  { to: '/super-admin',              label: 'Dashboard',          icon: DashIcon,     end: true  },
  { to: '/super-admin/departments',  label: 'Departments',        icon: BuildingIcon, end: false },
  { to: '/super-admin/admins',       label: 'Admins',             icon: UsersIcon,    end: false },
  { to: '/super-admin/registration', label: 'Registration Period', icon: CalendarIcon, end: false },
];

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      notificationApi.getUnreadCount()
        .then(({ data }) => setUnread(data.count ?? 0))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      <aside className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>

        <div className="h-16 flex items-center px-4 border-b border-slate-200 gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shrink-0 text-white">
            <ShieldIcon />
          </div>
          {!collapsed && (
            <span className="font-bold text-slate-900 text-sm tracking-tight flex-1">UniGate</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition ml-auto shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative border-l-2 ${
                  isActive
                    ? 'bg-red-50 text-red-600 border-red-600'
                    : 'text-slate-600 hover:bg-slate-50 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`shrink-0 ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    <Icon />
                  </div>
                  {!collapsed && <span>{label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2.5 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-2 space-y-1">
          {!collapsed && user && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-red-600 font-medium truncate">Super Admin</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition"
            title={collapsed ? 'Logout' : ''}
          >
            <LogoutIcon />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search system..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition">
              <BellIcon />
              {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"/>}
            </Link>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-red-600 font-medium leading-tight">Super Administrator</p>
              </div>
              <div className="w-9 h-9 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
