import React, { useEffect, useState } from 'react';
import { notificationApi } from '../services/api';

const TYPE_CONFIG = {
  APPLICATION_STATUS: { bg: 'bg-blue-100',   icon: 'text-blue-600',   dot: 'bg-blue-600' },
  DOCUMENT:           { bg: 'bg-violet-100',  icon: 'text-violet-600', dot: 'bg-violet-600' },
  GRADE:              { bg: 'bg-green-100',   icon: 'text-green-600',  dot: 'bg-green-600' },
  INTERNSHIP:         { bg: 'bg-amber-100',   icon: 'text-amber-600',  dot: 'bg-amber-500' },
  SKILL_SWAP:         { bg: 'bg-pink-100',    icon: 'text-pink-600',   dot: 'bg-pink-500' },
  SYSTEM:             { bg: 'bg-slate-100',   icon: 'text-slate-500',  dot: 'bg-slate-400' },
};

const TYPE_ICONS = {
  APPLICATION_STATUS: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  ),
  DOCUMENT: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
  GRADE: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  ),
  INTERNSHIP: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  ),
  SKILL_SWAP: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  ),
  SYSTEM: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
    </svg>
  ),
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    notificationApi.getMy()
      .then(({ data }) => setNotifications(data))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await notificationApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {[['all', 'All'], ['unread', 'Unread']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
            {key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-white/30 rounded-full px-1">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-slate-400 text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
            const Icon = TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM;
            return (
              <div
                key={n.id}
                className={`bg-white rounded-xl border px-4 py-4 flex items-start gap-3.5 transition ${
                  n.read ? 'border-slate-200' : 'border-blue-200 shadow-sm'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.icon}`}>
                  {Icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-slate-400 shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                </div>
                {!n.read && (
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${cfg.dot}`}/>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
