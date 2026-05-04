import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import ApplicationReview from './ApplicationReview';

const STATUS_CONFIG = {
  DRAFT:        { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  SUBMITTED:    { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  UNDER_REVIEW: { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  INCOMPLETE:   { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  APPROVED:     { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  REFUSED:      { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const STATUSES = ['', 'SUBMITTED', 'UNDER_REVIEW', 'INCOMPLETE', 'APPROVED', 'REFUSED'];
const FILTER_LABELS = { '': 'All', SUBMITTED: 'Pending', UNDER_REVIEW: 'In Review', INCOMPLETE: 'Incomplete', APPROVED: 'Approved', REFUSED: 'Refused' };

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

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
    <div className="px-6 py-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Applications Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Manage and review student registration applications</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
        {[
          { label: 'Total', value: stats.total, gradient: 'from-slate-500 to-gray-600' },
          { label: 'Pending', value: stats.submitted, gradient: 'from-blue-500 to-indigo-500' },
          { label: 'In Review', value: stats.underReview, gradient: 'from-amber-400 to-orange-500' },
          { label: 'Incomplete', value: stats.incomplete, gradient: 'from-orange-500 to-red-400' },
          { label: 'Approved', value: stats.approved, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Refused', value: stats.refused, gradient: 'from-red-500 to-rose-600' },
        ].map(({ label, value, gradient }) => (
          <div key={label} className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-sm`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs opacity-80 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s || 'all'}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {FILTER_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500">No applications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Student', 'Programme', 'Status', 'Docs', 'Submitted', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((app) => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.DRAFT;
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/60 transition group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {(app.studentName || ' ')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{app.studentName}</p>
                            <p className="text-xs text-gray-400">{app.studentEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
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
                          <div className="flex-1 max-w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${app.documentsTotal ? (app.documentsValid / app.documentsTotal) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{app.documentsValid}/{app.documentsTotal}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelectedId(app.id)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-semibold transition"
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
