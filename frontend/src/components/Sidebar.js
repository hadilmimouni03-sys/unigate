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
      { to: '/skillswap', label: t('nav.skillswap'), icon: SwapIcon },
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

const DashIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const CalIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const ChartIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
const SwapIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>;
const BriefIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const BellIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;

const Sidebar = ({ unread = 0 }) => {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const navItems = NAV_ITEMS(t, user?.role);

  return (
    <aside className={`flex flex-col bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">UG</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">UniGate</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition ml-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to} end={to === '/student' || to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`shrink-0 ${isActive ? 'text-purple-700' : 'text-gray-400 group-hover:text-gray-600'}`}>
                  <Icon />
                </div>
                {!collapsed && <span>{label}</span>}
                {badge && unread > 0 && (
                  <span className={`${collapsed ? 'absolute top-1.5 right-1.5' : 'ml-auto'} w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold`}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Language + User + Logout */}
      <div className="border-t border-gray-100 p-2 space-y-1">
        {/* Language */}
        <div className="relative">
          <button onClick={() => setShowLang(!showLang)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
            <span className="text-base shrink-0">{LANGUAGES.find((l) => l.code === lang)?.flag || '🌐'}</span>
            {!collapsed && (
              <>
                <span className="font-medium">{LANGUAGES.find((l) => l.code === lang)?.label}</span>
                <svg className={`w-3.5 h-3.5 ml-auto transition-transform ${showLang ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </>
            )}
          </button>
          {showLang && (
            <div className={`absolute ${collapsed ? 'left-full ml-2 bottom-0' : 'bottom-full left-0 right-0'} bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 mb-1`}>
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => { setLang(l.code); setShowLang(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition hover:bg-purple-50 ${lang === l.code ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'}`}>
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  {lang === l.code && <span className="ml-auto text-purple-600 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition">
          <LogoutIcon />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
