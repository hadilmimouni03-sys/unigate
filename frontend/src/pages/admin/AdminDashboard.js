import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ApplicationReview from './ApplicationReview';

const STATUS_CONFIG = {
  DRAFT:        { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400' },
  SUBMITTED:    { bg: 'bg-blue-100',   text: 'text-blue-700',    dot: 'bg-blue-500' },
  UNDER_REVIEW: { bg: 'bg-amber-100',  text: 'text-amber-700',   dot: 'bg-amber-500' },
  INCOMPLETE:   { bg: 'bg-orange-100', text: 'text-orange-700',  dot: 'bg-orange-500' },
  APPROVED:     { bg: 'bg-green-100',  text: 'text-green-700',   dot: 'bg-green-500' },
  REFUSED:      { bg: 'bg-red-100',    text: 'text-red-700',     dot: 'bg-red-500' },
};

const STATUSES = ['', 'SUBMITTED', 'UNDER_REVIEW', 'INCOMPLETE', 'APPROVED', 'REFUSED'];
const FILTER_LABELS = { '': 'All', SUBMITTED: 'Pending', UNDER_REVIEW: 'In Review', INCOMPLETE: 'Incomplete', APPROVED: 'Approved', REFUSED: 'Refused' };

const STAT_CARDS = [
  { key: 'total',      label: 'Total',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'from-slate-500 to-slate-600', iconColor: 'text-slate-200' },
  { key: 'submitted',  label: 'Pending',    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                                                                                  color: 'from-blue-500 to-blue-600',  iconColor: 'text-blue-200' },
  { key: 'underReview',label: 'In Review',  icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',                                                                                  color: 'from-amber-400 to-amber-500', iconColor: 'text-amber-100' },
  { key: 'incomplete', label: 'Incomplete', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',                                                                                                       color: 'from-orange-400 to-orange-500', iconColor: 'text-orange-100' },
  { key: 'approved',   label: 'Approved',   icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                                                                               color: 'from-green-500 to-emerald-500', iconColor: 'text-green-100' },
  { key: 'refused',    label: 'Refused',    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                                                        color: 'from-red-500 to-red-600',      iconColor: 'text-red-100' },
];

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const { user } = useAuth();
  const dept = user?.department;

  useEffect(() => { loadApplications(); }, [filterStatus]);

  const loadApplications = () => {
    setLoading(true);
    adminApi.getApplications(filterStatus || undefined)
      .then(({ data }) => setApplications(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (selectedId) {
    return (
      <ApplicationReview
        applicationId={selectedId}
        onBack={() => { setSelectedId(null); loadApplications(); }}
      />
    );
  }

  const stats = {
    total: applications.length,
    submitted: applications.filter((a) => a.status === 'SUBMITTED').length,
    underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    refused: applications.filter((a) => a.status === 'REFUSED').length,
    incomplete: applications.filter((a) => a.status === 'INCOMPLETE').length,
  };

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.studentName?.toLowerCase().includes(q) || a.studentEmail?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl p-7 text-white">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Applications Dashboard</h1>
          <p className="text-slate-300 text-sm">Manage and review student registration applications</p>
          {dept && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              {dept} Department
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(({ key, label, icon, color, iconColor }) => (
          <div key={key} className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path d={icon}/>
              </svg>
            </div>
            <p className="text-2xl font-bold">{stats[key]}</p>
            <p className="text-xs opacity-80 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="w-full pl-9 pr-4 h-10 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                filterStatus === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No applications found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Student', 'Programme', 'Status', 'Docs', 'Submitted', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.DRAFT;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {(app.studentName || ' ')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{app.studentName}</p>
                            <p className="text-xs text-slate-400">{app.studentEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                          {app.registrationType?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                          {app.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${app.documentsTotal ? (app.documentsValid / app.documentsTotal) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 font-medium">{app.documentsValid}/{app.documentsTotal}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedId(app.id)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-semibold transition bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                        >
                          Review
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
