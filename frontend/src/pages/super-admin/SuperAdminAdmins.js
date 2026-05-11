import React, { useCallback, useEffect, useState } from 'react';
import { superAdminApi } from '../../services/api';

const initials = (firstName, lastName) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', department: '' };

const SuperAdminAdmins = () => {
  const [admins,       setAdmins]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [formError,    setFormError]    = useState(null);
  const [submitting,   setSubmitting]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    superAdminApi.getAdmins()
      .then(({ data }) => setAdmins(data))
      .catch(() => setError('Failed to load administrators'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = () => { setForm(EMPTY_FORM); setFormError(null); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.department) {
      setFormError('All fields are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    superAdminApi.createAdmin(form)
      .then(({ data }) => {
        setAdmins((prev) => [...prev, data]);
        closeModal();
      })
      .catch((err) => {
        setFormError(err.response?.data || 'Failed to create administrator.');
      })
      .finally(() => setSubmitting(false));
  };

  const topPerformer = admins.length > 0
    ? [...admins].sort((a, b) => (b.reviewedCount || 0) - (a.reviewedCount || 0))[0]
    : null;
  const avgPending = admins.length > 0
    ? Math.round(admins.reduce((s, a) => s + (a.pendingCount || 0), 0) / admins.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Department Administrators</h1>
          <p className="text-slate-500 mt-1">Manage and monitor admin performance across departments</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Administrator
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {topPerformer && (
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-green-500 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Top Performer</span>
              <svg className="w-5 h-5 text-amber-500 fill-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <p className="text-base font-bold text-slate-900">{topPerformer.firstName} {topPerformer.lastName}</p>
            <p className="text-xs text-green-600 mt-1">{topPerformer.reviewedCount} reviewed · {topPerformer.department}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Admins</span>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900">{admins.length}</p>
          <p className="text-xs text-slate-500 mt-1">Across all departments</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Avg Pending</span>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 8v4l3 3M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900">{avgPending}</p>
          <p className="text-xs text-slate-500 mt-1">Applications per admin</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {admins.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No administrators found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Administrator', 'Department', 'Email', 'Reviewed', 'Pending'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                          {initials(admin.firstName, admin.lastName)}
                        </div>
                        <p className="font-semibold text-slate-900">{admin.firstName} {admin.lastName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                        {admin.department || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{admin.email}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 text-slate-700">
                        {admin.reviewedCount}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        admin.pendingCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {admin.pendingCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add Administrator</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}

            <div className="space-y-4">
              {[
                { label: 'First Name',  name: 'firstName',  placeholder: 'Jane',                       type: 'text'     },
                { label: 'Last Name',   name: 'lastName',   placeholder: 'Smith',                      type: 'text'     },
                { label: 'Email',       name: 'email',      placeholder: 'jane.smith@university.edu',  type: 'email'    },
                { label: 'Password',    name: 'password',   placeholder: 'Min 6 characters',           type: 'password' },
                { label: 'Department',  name: 'department', placeholder: 'Computer Science',           type: 'text'     },
              ].map(({ label, name, placeholder, type }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={form[name]}
                    onChange={handleChange}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed rounded-lg transition"
              >
                {submitting ? 'Creating…' : 'Add Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAdmins;
