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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar unread={unread} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative text-gray-500 hover:text-blue-600 transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
