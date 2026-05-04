import React, { useState, useEffect } from 'react';
import { internshipApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  PENDING:              { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pending' },
  SHORTLISTED:          { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Shortlisted' },
  INTERVIEW_SCHEDULED:  { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Interview' },
  ACCEPTED:             { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Accepted' },
  REJECTED:             { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected' },
  WITHDRAWN:            { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Withdrawn' },
};

const InternshipsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [offers, setOffers] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [tab, setTab] = useState('offers');
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState(null);
  const [applyingTo, setApplyingTo] = useState(null);
  const [feedback, setFeedback] = useState({ msg: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    internshipApi.getOffers()
      .then(({ data }) => setOffers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    if (!isAdmin) {
      internshipApi.myApplications().then(({ data }) => setMyApps(data)).catch(() => {});
    }
  }, [isAdmin]);

  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback({ msg: '', type: 'success' }), 3500);
  };

  const handleApply = async (offerId) => {
    setSubmitting(true);
    try {
      await internshipApi.apply(offerId, coverLetter, cvFile);
      notify('Application submitted successfully!');
      setApplyingTo(null);
      setCoverLetter('');
      setCvFile(null);
      internshipApi.myApplications().then(({ data }) => setMyApps(data));
    } catch (err) {
      notify(err.response?.data?.message || 'Application failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const daysUntil = (deadline) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Internships</h1>
      <p className="text-gray-500 text-sm mb-6">Discover and apply for internship opportunities</p>

      {feedback.msg && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {feedback.type === 'error'
            ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          }
          {feedback.msg}
        </div>
      )}

      {/* Stats bar */}
      {!isAdmin && myApps.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Applied', value: myApps.length, color: 'from-blue-500 to-indigo-500' },
            { label: 'Shortlisted', value: myApps.filter(a => a.status === 'SHORTLISTED').length, color: 'from-violet-500 to-purple-500' },
            { label: 'Accepted', value: myApps.filter(a => a.status === 'ACCEPTED').length, color: 'from-green-500 to-emerald-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs opacity-80">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        <button
          onClick={() => setTab('offers')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'offers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Available Offers
          {offers.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {offers.length}
            </span>
          )}
        </button>
        {!isAdmin && (
          <button
            onClick={() => setTab('my')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === 'my' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Applications
            {myApps.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {myApps.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Offers */}
      {tab === 'offers' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">💼</div>
              <p className="text-gray-500">No offers available at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => {
                const days = daysUntil(offer.applicationDeadline);
                const urgent = days != null && days <= 7;
                return (
                  <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      {/* Company logo placeholder */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 text-blue-700 font-bold text-lg">
                        {(offer.companyName || 'C')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{offer.companyName}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {offer.durationMonths && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                                {offer.durationMonths}mo
                              </span>
                            )}
                            {offer.requiredDepartment && (
                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                                {offer.requiredDepartment}
                              </span>
                            )}
                            {days != null && (
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {days <= 0 ? 'Deadline passed' : `${days}d left`}
                              </span>
                            )}
                          </div>
                        </div>

                        {offer.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{offer.description}</p>
                        )}

                        {!isAdmin && applyingTo !== offer.id && (
                          <button
                            onClick={() => setApplyingTo(offer.id)}
                            disabled={days != null && days <= 0}
                            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-semibold transition"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>

                    {applyingTo === offer.id && (
                      <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            Cover Letter
                          </label>
                          <textarea
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            placeholder="Write a brief cover letter explaining your interest and qualifications..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                            CV / Résumé <span className="text-red-500">*</span>
                          </label>
                          <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition ${
                            cvFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-400 bg-gray-50'
                          }`}>
                            <svg className={`w-5 h-5 shrink-0 ${cvFile ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <span className={`text-sm ${cvFile ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                              {cvFile ? cvFile.name : 'Click to upload PDF (max 5MB)'}
                            </span>
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => setCvFile(e.target.files[0] || null)}
                            />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApply(offer.id)}
                            disabled={submitting || !cvFile}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold transition"
                          >
                            {submitting ? 'Submitting…' : 'Submit Application'}
                          </button>
                          <button
                            onClick={() => { setApplyingTo(null); setCoverLetter(''); setCvFile(null); }}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My Applications */}
      {tab === 'my' && (
        <div>
          {myApps.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-500">You haven't applied to any offers yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApps.map((app) => {
                const cfg = STATUS_CONFIG[app.status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: app.status };
                return (
                  <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                      {(app.companyName || 'C')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{app.offerTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{app.companyName}</p>
                      {app.cvDownloadUrl && (
                        <a
                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:8081'}${app.cvDownloadUrl}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                          {app.cvFileName || 'Download CV'}
                        </a>
                      )}
                      {app.adminNote && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{app.adminNote}"</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InternshipsPage;
