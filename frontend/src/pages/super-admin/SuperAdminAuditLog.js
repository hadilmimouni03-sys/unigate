import React, { useState, useMemo } from 'react';

const AUDIT_LOGS = [
  { timestamp: '2026-05-09 14:32:15', user: 'Dr. Sarah Johnson',  role: 'Dept Admin',  action: 'Approved application',       target: 'APP-2024-159', ip: '192.168.1.45',  type: 'approval'        },
  { timestamp: '2026-05-09 14:28:42', user: 'Prof. Michael Chen', role: 'Faculty',     action: 'Verified document',           target: 'DOC-2024-892', ip: '192.168.1.67',  type: 'verification'    },
  { timestamp: '2026-05-09 14:15:33', user: 'Admin User',         role: 'Super Admin', action: 'Updated department settings', target: 'Engineering',  ip: '192.168.1.10',  type: 'configuration'   },
  { timestamp: '2026-05-09 13:58:21', user: 'Dr. Emily Davis',    role: 'Dept Admin',  action: 'Rejected application',        target: 'APP-2024-158', ip: '192.168.1.52',  type: 'rejection'       },
  { timestamp: '2026-05-09 13:45:12', user: 'John Doe',           role: 'Student',     action: 'Uploaded document',           target: 'DOC-2024-893', ip: '192.168.1.124', type: 'upload'          },
  { timestamp: '2026-05-09 13:32:08', user: 'Admin User',         role: 'Super Admin', action: 'Created new admin',           target: 'Prof. Taylor', ip: '192.168.1.10',  type: 'user_management' },
  { timestamp: '2026-05-09 13:18:55', user: 'Prof. James Wilson', role: 'Dept Admin',  action: 'Modified timetable',          target: 'Medicine 3rd', ip: '192.168.1.78',  type: 'configuration'   },
  { timestamp: '2026-05-09 13:05:40', user: 'Alice Martin',       role: 'Student',     action: 'Submitted application',       target: 'APP-2024-160', ip: '192.168.1.201', type: 'upload'          },
  { timestamp: '2026-05-09 12:52:11', user: 'Dr. Linda Martinez', role: 'Dept Admin',  action: 'Approved application',        target: 'APP-2024-155', ip: '192.168.1.55',  type: 'approval'        },
  { timestamp: '2026-05-09 12:38:29', user: 'Admin User',         role: 'Super Admin', action: 'Closed registration period',  target: 'Fall 2025',    ip: '192.168.1.10',  type: 'configuration'   },
];

const TYPE_CONFIG = {
  approval:        { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  verification:    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  rejection:       { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  upload:          { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  user_management: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  configuration:   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
};

const PAGE_SIZE = 7;

const SuperAdminAuditLog = () => {
  const [search, setSearch]       = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [page, setPage]           = useState(0);
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return AUDIT_LOGS.filter((log) => {
      const matchSearch = !q || log.user.toLowerCase().includes(q) || log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) || log.ip.includes(q);
      const matchType = !typeFilter || log.type === typeFilter;
      const matchFrom = !fromDate || log.timestamp >= fromDate;
      const matchTo   = !toDate   || log.timestamp <= toDate + ' 23:59:59';
      return matchSearch && matchType && matchFrom && matchTo;
    });
  }, [search, typeFilter, fromDate, toDate]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const safePage   = Math.min(page, totalPages - 1);
  const visible    = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const TYPE_LABELS = ['', 'approval', 'verification', 'rejection', 'upload', 'user_management', 'configuration'];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-500 mt-1">System-wide activity tracking and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-red-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by user, action, target, or IP..."
              className="w-full h-10 pl-10 pr-4 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>

          {/* Type filter */}
          <select
            className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition text-slate-700"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Types</option>
            {TYPE_LABELS.slice(1).map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
            />
            <span className="text-xs text-slate-500">To:</span>
            <input
              type="date"
              className="h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Timestamp', 'User', 'Role', 'Action', 'Target', 'IP Address', 'Type'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No audit log entries match your filters.
                  </td>
                </tr>
              ) : (
                visible.map((log, idx) => {
                  const tc = TYPE_CONFIG[log.type] || TYPE_CONFIG.configuration;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">{log.user}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold border border-slate-200 text-slate-600">
                          {log.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">{log.action}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{log.target}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{log.ip}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tc.bg} ${tc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`}/>
                          {log.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE + PAGE_SIZE, filtered.length)} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 text-xs font-semibold rounded-lg transition ${
                  i === safePage ? 'bg-red-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAuditLog;
