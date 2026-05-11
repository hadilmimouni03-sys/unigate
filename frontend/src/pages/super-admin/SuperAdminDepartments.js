import React, { useCallback, useEffect, useState } from 'react';
import { superAdminApi } from '../../services/api';

const COLORS = ['blue', 'orange', 'purple', 'red', 'green', 'cyan', 'indigo', 'rose'];

const COLOR_CLASSES = {
  blue:   { border: 'border-t-blue-500',   bar: 'bg-blue-500'   },
  orange: { border: 'border-t-orange-500', bar: 'bg-orange-500' },
  purple: { border: 'border-t-purple-500', bar: 'bg-purple-500' },
  red:    { border: 'border-t-red-500',    bar: 'bg-red-500'    },
  green:  { border: 'border-t-green-500',  bar: 'bg-green-500'  },
  cyan:   { border: 'border-t-cyan-500',   bar: 'bg-cyan-500'   },
  indigo: { border: 'border-t-indigo-500', bar: 'bg-indigo-500' },
  rose:   { border: 'border-t-rose-500',   bar: 'bg-rose-500'   },
};

const SuperAdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    superAdminApi.getDepartments()
      .then(({ data }) => setDepartments(data))
      .catch(() => setError('Failed to load departments'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  const totalApplications = departments.reduce((s, d) => s + d.totalApplications, 0);
  const avgSla = departments.length > 0
    ? Math.round(departments.reduce((s, d) => s + d.slaCompliance, 0) / departments.length)
    : 0;

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 mt-1">Manage university departments and monitor performance</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Departments',   value: departments.length, color: 'text-slate-900' },
          { label: 'Total Applications',  value: totalApplications,  color: 'text-red-600'   },
          { label: 'Avg SLA Compliance',  value: `${avgSla}%`,       color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {departments.length === 0 && !error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm">No department data available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept, idx) => {
            const colorKey = COLORS[idx % COLORS.length];
            const cc = COLOR_CLASSES[colorKey];
            const isBelowSla = dept.slaCompliance < 90;
            const enrollPct = dept.totalApplications > 0
              ? Math.min(Math.round((dept.enrolled / dept.totalApplications) * 100), 100)
              : 0;

            return (
              <div key={dept.name} className={`bg-white rounded-xl border border-slate-200 border-t-4 ${cc.border} shadow-sm hover:shadow-md transition-shadow`}>
                <div className="p-6">

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{dept.adminCount} admin{dept.adminCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="space-y-3">

                    <div>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="text-slate-500">Enrolled / Total</span>
                        <span className="font-semibold text-slate-800">{dept.enrolled}/{dept.totalApplications}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${cc.bar} rounded-full transition-all`} style={{ width: `${enrollPct}%` }}/>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 text-xs">SLA Compliance</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isBelowSla ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isBelowSla ? 'bg-amber-500' : 'bg-green-500'}`}/>
                        {dept.slaCompliance}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Pending</span>
                      <span className="font-semibold text-slate-800">{dept.pending}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Under Review</span>
                      <span className="font-semibold text-slate-800">{dept.underReview}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Refused</span>
                      <span className="font-semibold text-slate-800">{dept.refused}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDepartments;
