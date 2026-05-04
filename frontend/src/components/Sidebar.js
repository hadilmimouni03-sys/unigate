import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { LANGUAGES } from '../i18n/translations';

const NAV_ITEMS = (t, role) => {
  const student = role === 'STUDENT';
  const admin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const items = [];
  if (student) {
    items.push(
      { to: '/student', label: t('nav.dashboard'), icon: DashIcon },
      { to: '/timetable', label: t('nav.timetable'), icon: CalIcon },
      { to: '/grades', label: t('nav.grades'), icon: ChartIcon },
      { to: '/skillswap', label: t('nav.skillswap'), icon: UsersIcon },
      { to: '/internships', label: t('nav.internships'), icon: BriefIcon },
      { to: '/notifications', label: t('nav.notifications'), icon: BellIcon, badge: true },
    );
  } else if (admin) {
    items.push(
      { to: '/admin', label: t('nav.dashboard'), icon: DashIcon },
      { to: '/internships', label: t('nav.internships'), icon: BriefIcon },
      { to: '/notifications', label: t('nav.notifications'), icon: BellIcon, badge: true },
    );
  }
  return items;
};

const DashIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const CalIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const ChartIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
const UsersIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const BriefIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const BellIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
const GlobeIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>;

const Sidebar = ({ unread = 0 }) => {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const navItems = NAV_ITEMS(t, user?.role);

  return (
    <aside className={`flex flex-col bg-primary-950 border-r border-primary-900 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>

      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-primary-900">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">UG</span>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">UniGate</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-800 text-primary-400 hover:text-white transition ml-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to} to={to}
            end={to === '/student' || to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-primary-300 hover:bg-primary-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`shrink-0 ${isActive ? 'text-white' : 'text-primary-400 group-hover:text-white'}`}>
                  <Icon />
                </div>
                {!collapsed && <span>{label}</span>}
                {badge && unread > 0 && (
                  <span className={`${collapsed ? 'absolute top-1.5 right-1.5' : 'ml-auto'} min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1`}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
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

      {/* Bottom: Language + User + Logout */}
      <div className="border-t border-primary-900 p-2 space-y-1">

        {/* Language picker */}
        <div className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-primary-300 hover:bg-primary-800 hover:text-white transition"
          >
            <span className="shrink-0 text-primary-400"><GlobeIcon /></span>
            {!collapsed && (
              <>
                <span className="font-medium text-sm">{LANGUAGES.find((l) => l.code === lang)?.label}</span>
                <svg className={`w-3.5 h-3.5 ml-auto transition-transform ${showLang ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </>
            )}
          </button>
          {showLang && (
            <div className={`absolute ${collapsed ? 'left-full ml-2 bottom-0' : 'bottom-full left-0 right-0'} bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 mb-1`}>
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setShowLang(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition hover:bg-primary-50 ${lang === l.code ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-700'}`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  {lang === l.code && (
                    <svg className="w-3.5 h-3.5 ml-auto text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-900">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-primary-400 truncate">{user.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-primary-300 hover:bg-red-900/40 hover:text-red-300 transition"
        >
          <LogoutIcon />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
