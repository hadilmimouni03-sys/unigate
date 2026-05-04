import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      notificationApi.getUnreadCount()
        .then(({ data }) => setUnread(data.count))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'STUDENT') return '/student';
    return '/admin';
  };

  const navLinks = user ? [
    { to: dashboardPath(), label: 'Dashboard' },
    { to: '/timetable', label: 'Timetable' },
    { to: '/grades', label: 'Grades' },
    { to: '/skillswap', label: 'Skill Swap' },
    { to: '/internships', label: 'Internships' },
  ] : [];

  return (
    <nav className="bg-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={dashboardPath()} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-700 font-bold text-sm">UG</span>
            </div>
            <span className="font-bold text-xl tracking-tight">UniGate</span>
          </Link>

          {user && (
            <>
              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="px-3 py-2 rounded-md text-sm font-medium text-primary-100 hover:bg-primary-600 hover:text-white transition"
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <Link to="/notifications" className="relative p-2 rounded-full hover:bg-primary-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>

                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-medium">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-primary-200">{user.role?.replace('_', ' ')}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-primary-600 hover:bg-primary-500 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
