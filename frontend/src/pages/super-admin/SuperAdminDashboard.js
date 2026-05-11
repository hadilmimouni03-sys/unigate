import React, { useCallback, useEffect, useState } from 'react';
import { adminApi, superAdminApi } from '../../services/api';

function buildWeeklyData(applications) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const dayApps = applications.filter(
      (a) => a.submittedAt && new Date(a.submittedAt).toDateString() === dateStr,
    );
    return {
      day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      applications: dayApps.length,
      enrolled: dayApps.filter((a) => a.status === 'APPROVED').length,
    };
  });
}

const SVGLineChart = ({ data }) => {
  const W = 600, H = 200;
  const PL = 8, PR = 8, PT = 16, PB = 28;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const maxVal = Math.max(...data.map((d) => Math.max(d.applications, d.enrolled)), 1);

  const x = (i) => PL + (i / Math.max(data.length - 1, 1)) * cW;
  const y = (v) => PT + cH - (v / maxVal) * cH;

  const toPath = (key) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const yy = (PT + cH * (1 - f)).toFixed(1);
        return (
          <line key={f} x1={PL} x2={PL + cW} y1={yy} y2={yy}
            stroke="#e2e8f0" strokeDasharray="4 4" />
        );
      })}
      <path d={toPath('applications')} fill="none" stroke="#ef4444" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath('enrolled')} fill="none" stroke="#10b981" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <React.Fragment key={i}>
          <circle cx={x(i)} cy={y(d.applications)} r={3.5} fill="#ef4444" />
          <circle cx={x(i)} cy={y(d.enrolled)} r={3.5} fill="#10b981" />
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">
            {d.day}
          </text>
        </React.Fragment>
      ))}
    </svg>
  );
};

const SuperAdminDashboard = () => {
  const [applications, setApplications]   = useState([]);
  const [departments,  setDepartments]    = useState([]);
  const [swapStats,    setSwapStats]      = useState(null);
  const [loading,      setLoading]        = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.getApplications(),
      superAdminApi.getDepartments(),
      superAdminApi.getSkillSwapStats(),
    ])
      .then(([appsRes, deptRes, swapRes]) => {
        setApplications(appsRes.data);
        setDepartments(deptRes.data);
        setSwapStats(swapRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = {
    total:       applications.length,
    submitted:   applications.filter((a) => a.status === 'SUBMITTED').length,
    underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
    approved:    applications.filter((a) => a.status === 'APPROVED').length,
    refused:     applications.filter((a) => a.status === 'REFUSED').length,
  };

  const processed = stats.approved + stats.refused;
  const pending   = stats.submitted + stats.underReview;
  const sla = stats.total > 0
    ? Math.round((processed / Math.max(processed + pending, 1)) * 100)
    : 100;

  const weeklyData = buildWeeklyData(applications);

  const showSlaAlert = !alertDismissed && stats.submitted > 10;

  const METRIC_CARDS = [
    {
      label: 'Total Applications', value: stats.total,
      trend: `+${Math.max(weeklyData.reduce((s, d) => s + d.applications, 0), 0)} this week`,
      color: 'border-l-red-500', iconBg: 'bg-red-50', iconColor: 'text-red-500',
      icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
    },
    {
      label: 'Enrolled Students', value: stats.approved,
      trend: `${stats.approved} approved total`,
      color: 'border-l-green-500', iconBg: 'bg-green-50', iconColor: 'text-green-500',
      icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 3a4 4 0 100 8 4 4 0 000-8z',
    },
    {
      label: 'SLA Compliance', value: `${sla}%`,
      trend: processed > 0 ? `${processed} applications processed` : 'No processed yet',
      color: 'border-l-purple-500', iconBg: 'bg-purple-50', iconColor: 'text-purple-500',
      icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    },
    {
      label: 'Active Departments', value: departments.length,
      trend: 'All operational',
      color: 'border-l-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
      icon: 'M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-4h6v4',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  const activeMatchesPct  = swapStats ? Math.min(Math.round((swapStats.activeMatches  / Math.max(swapStats.activeOffers,  1)) * 100), 100) : 0;
  const completedSwapsPct = swapStats ? Math.min(Math.round((swapStats.completedSwaps / Math.max(swapStats.activeOffers + swapStats.completedSwaps, 1)) * 100), 100) : 0;

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-slate-900">System Dashboard</h1>
        <p className="text-slate-500 mt-1">University-wide overview and monitoring</p>
      </div>

      {showSlaAlert && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900 mb-1">Pending Review Alert</h3>
                <p className="text-sm text-red-700 mb-3">
                  {stats.submitted} application{stats.submitted !== 1 ? 's' : ''} are awaiting review across departments.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setAlertDismissed(true)}
                    className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-lg transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-red-500 animate-pulse shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_CARDS.map(({ label, value, trend, color, iconBg, iconColor, icon }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${color} p-5 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
                <svg className={`w-4 h-4 ${iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path d={icon}/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Application Trends</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days — submissions vs approvals</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block"/>Applications
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block"/>Enrolled
              </span>
            </div>
          </div>
          <SVGLineChart data={weeklyData} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-5">Skill Swap Stats</h2>
          {swapStats ? (
            <div className="space-y-5">
              {[
                { label: 'Active Matches',   value: swapStats.activeMatches,  pct: activeMatchesPct,  color: 'bg-blue-500'  },
                { label: 'Completed Swaps',  value: swapStats.completedSwaps, pct: completedSwapsPct, color: 'bg-green-500' },
              ].map(({ label, value, pct, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-600">{label}</span>
                    <span className="text-xl font-bold text-slate-900">{value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}/>
                  </div>
                </div>
              ))}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">Avg Rating</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-xl font-bold text-slate-900">{swapStats.averageRating || '—'}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500">{swapStats.activeOffers} active offers</div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No data available</p>
          )}
        </div>
      </div>

      {departments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Department Performance</h2>
            <p className="text-xs text-slate-400 mt-0.5">SLA compliance and pending reviews by department</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Department', 'Total Applications', 'SLA Compliance', 'Pending Review', 'Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departments.map((dept) => (
                  <tr key={dept.name} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 font-medium text-slate-900">{dept.name}</td>
                    <td className="px-5 py-4 text-slate-600">{dept.totalApplications}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        dept.slaCompliance >= 90 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dept.slaCompliance >= 90 ? 'bg-green-500' : 'bg-amber-500'}`}/>
                        {dept.slaCompliance}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{dept.pending}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        dept.slaCompliance >= 90 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dept.slaCompliance >= 90 ? 'bg-green-500' : 'bg-amber-500'}`}/>
                        {dept.slaCompliance >= 90 ? 'healthy' : 'warning'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
