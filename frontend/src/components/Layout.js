import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { notificationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      notificationApi.getUnreadCount()
        .then(({ data }) => setUnread(data.count ?? 0))
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar unread={unread} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-600 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"/>
              )}
            </Link>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500 leading-tight">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
