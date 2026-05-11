import React, { useCallback, useEffect, useState } from 'react';
import { superAdminApi } from '../../services/api';

const CircularProgress = ({ value, max, label }) => {
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(value, max) / Math.max(max, 1));

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} stroke="#fee2e2" strokeWidth={8} fill="none"/>
        <circle
          cx="64" cy="64" r={r}
          stroke="#dc2626" strokeWidth={8} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-slate-900">{value}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
    </div>
  );
};

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${checked ? 'bg-red-600' : 'bg-slate-300'}`}
  >
    <span
      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

function daysRemaining(endDate) {
  const end  = new Date(endDate);
  const now  = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

function periodDuration(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
}

const SuperAdminRegistrationPeriod = () => {
  const [periods,      setPeriods]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [newName,      setNewName]      = useState('');
  const [newStart,     setNewStart]     = useState('');
  const [newEnd,       setNewEnd]       = useState('');
  const [creating,     setCreating]     = useState(false);
  const [createError,  setCreateError]  = useState(null);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [closingId,    setClosingId]    = useState(null);
  const [closing,      setClosing]      = useState(false);
  const [autoClose,    setAutoClose]    = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [slaMonitoring,  setSlaMonitoring]  = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    superAdminApi.getRegistrationPeriods()
      .then(({ data }) => setPeriods(data))
      .catch(() => setError('Failed to load registration periods'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const activePeriod = periods.find((p) => p.status === 'ACTIVE') || null;

  const handleCreate = () => {
    if (!newName || !newStart || !newEnd) { setCreateError('All fields are required.'); return; }
    setCreating(true);
    setCreateError(null);
    superAdminApi.createRegistrationPeriod({ name: newName, startDate: newStart, endDate: newEnd })
      .then(({ data }) => {
        setPeriods((prev) => [data, ...prev]);
        setNewName(''); setNewStart(''); setNewEnd('');
      })
      .catch((err) => setCreateError(err.response?.data || 'Failed to create period.'))
      .finally(() => setCreating(false));
  };

  const confirmClose = (id) => { setClosingId(id); setShowConfirm(true); };

  const handleClose = () => {
    if (!closingId) return;
    setClosing(true);
    superAdminApi.closePeriod(closingId)
      .then(({ data }) => {
        setPeriods((prev) => prev.map((p) => (p.id === data.id ? data : p)));
        setShowConfirm(false);
        setClosingId(null);
      })
      .catch(() => {})
      .finally(() => setClosing(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  const remaining = activePeriod ? daysRemaining(activePeriod.endDate) : 0;
  const duration  = activePeriod ? periodDuration(activePeriod.startDate, activePeriod.endDate) : 60;

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Registration Period</h1>
        <p className="text-slate-500 mt-1">Manage university-wide registration windows</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          {activePeriod ? (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{activePeriod.name}</h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Active
                    </span>
                    <span className="text-sm text-slate-600">{activePeriod.startDate} → {activePeriod.endDate}</span>
                  </div>
                </div>
                <CircularProgress value={remaining} max={duration} label="days left" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Total Applications', value: activePeriod.totalApplications, color: 'text-slate-900' },
                  { label: 'Days Remaining',      value: remaining,                      color: 'text-red-600'   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => confirmClose(activePeriod.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                  Close Registration
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-slate-500 text-sm">No active registration period. Create one using the form on the right.</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <h3 className="text-base font-bold text-slate-900">Registration History</h3>
            </div>

            {periods.length === 0 ? (
              <p className="text-sm text-slate-400">No periods yet.</p>
            ) : (
              <div className="space-y-3">
                {periods.map((period) => (
                  <div
                    key={period.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                      period.status === 'ACTIVE' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900">{period.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{period.startDate} → {period.endDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{period.totalApplications}</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                        period.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${period.status === 'ACTIVE' ? 'bg-green-500' : 'bg-slate-400'}`}/>
                        {period.status === 'ACTIVE' ? 'active' : 'closed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">

          <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create New Period</h3>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{createError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Period Name</label>
                <input
                  type="text"
                  placeholder="Fall 2026"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!newName || !newStart || !newEnd || creating}
              className="w-full mt-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
            >
              {creating ? 'Creating…' : 'Create Period'}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3 className="text-base font-bold text-slate-900">Automation</h3>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Auto-close',      desc: 'Close at end date',     value: autoClose,      onChange: setAutoClose      },
                { label: 'Email reminders', desc: '7 days before end',     value: emailReminders, onChange: setEmailReminders },
                { label: 'SLA monitoring',  desc: 'Track compliance',      value: slaMonitoring,  onChange: setSlaMonitoring  },
              ].map(({ label, desc, value, onChange }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <Toggle checked={value} onChange={onChange} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> Closing registration prevents new applications. Existing applications can still be processed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Close Registration?</h3>
            <p className="text-sm text-slate-600 mb-6">
              This will close the registration period. No new applications will be accepted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setClosingId(null); }}
                className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                disabled={closing}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg transition"
              >
                {closing ? 'Closing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminRegistrationPeriod;
