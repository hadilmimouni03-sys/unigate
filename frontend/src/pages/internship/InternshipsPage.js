import React, { useState, useEffect } from 'react';
import { internshipApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  PENDING:             { badge: 'bg-amber-500',  label: 'Under Review', step: 1 },
  SHORTLISTED:         { badge: 'bg-blue-500',   label: 'Shortlisted',  step: 2 },
  INTERVIEW_SCHEDULED: { badge: 'bg-violet-500', label: 'Interview',    step: 2 },
  ACCEPTED:            { badge: 'bg-green-500',  label: 'Accepted',     step: 3, outcome: 'accepted' },
  REJECTED:            { badge: 'bg-red-500',    label: 'Refused',      step: 3, outcome: 'refused'  },
  WITHDRAWN:           { badge: 'bg-slate-400',  label: 'Withdrawn',    step: 3, outcome: 'refused'  },
};

const STEPS = ['Applied', 'Under Review', 'Interview', 'Decision'];

/* ── Inline SVG icons (no external lib) ── */
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7"/>
  </svg>
);
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
);
const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
  </svg>
);
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12"/>
  </svg>
);

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
  </div>
);

const InternshipsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [offers, setOffers]         = useState([]);
  const [myApps, setMyApps]         = useState([]);
  const [tab, setTab]               = useState('explore');
  const [search, setSearch]         = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [applyingTo, setApplyingTo] = useState(null);
  const [viewingOffer, setViewingOffer] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile]         = useState(null);
  const [feedback, setFeedback]     = useState({ msg: '', type: 'success' });
  const [loading, setLoading]       = useState(false);
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
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const filteredOffers = offers.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || o.title?.toLowerCase().includes(q)
      || o.companyName?.toLowerCase().includes(q)
      || o.description?.toLowerCase().includes(q);
    const matchesLevel = levelFilter === 'all' || o.targetYear === levelFilter;
    const matchesType  = typeFilter === 'all'  || o.internshipType === typeFilter;
    return matchesSearch && matchesLevel && matchesType;
  });

  const recommended = filteredOffers.slice(0, 3);

  const getStepInfo = (status) =>
    STATUS_CONFIG[status] || { badge: 'bg-slate-400', label: 'Pending', step: 0 };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Internships & Opportunities</h1>
        <p className="text-slate-500">Discover and apply to internships tailored for you</p>
      </div>

      {/* Toast */}
      {feedback.msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {feedback.type === 'error'
              ? <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              : <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>}
          </svg>
          {feedback.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        <button
          onClick={() => setTab('explore')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
            tab === 'explore' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Explore Opportunities
        </button>
        {!isAdmin && (
          <button
            onClick={() => setTab('applications')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              tab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Applications
            {myApps.length > 0 && (
              <span className="bg-blue-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">{myApps.length}</span>
            )}
          </button>
        )}
      </div>

      {/* ── EXPLORE TAB ── */}
      {tab === 'explore' && (
        <div className="space-y-6">

          {/* Filter bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search internships, companies, or keywords..."
                  className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
              </div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="h-11 border border-slate-200 rounded-xl px-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
              >
                <option value="all">All Levels</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="master">Master M2</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 border border-slate-200 rounded-xl px-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
              >
                <option value="all">All Types</option>
                <option value="final">Final Year Project</option>
                <option value="worker">Worker Internship</option>
                <option value="summer">Summer Internship</option>
              </select>
            </div>
          </div>

          {loading ? <Spinner/> : (
            <>
              {/* Recommended */}
              {recommended.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                    <h2 className="text-2xl font-bold text-slate-900">Recommended for You</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommended.map((offer) => {
                      const days = daysUntil(offer.applicationDeadline);
                      const expired = days != null && days <= 0;
                      return (
                        <div key={offer.id} className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-200 hover:shadow-xl transition-all p-6">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mb-4">
                            {(offer.companyName || 'C')[0].toUpperCase()}
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg mb-1">{offer.title}</h3>
                          <p className="text-slate-600 mb-4">{offer.companyName}</p>
                          {offer.description && (
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{offer.description}</p>
                          )}
                          <div className="space-y-2 mb-4">
                            {offer.location && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span>{offer.location}</span>
                              </div>
                            )}
                            {offer.durationMonths && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                                </svg>
                                <span>{offer.durationMonths} months</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {offer.requiredDepartment && (
                              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-300 text-blue-700 font-medium">
                                {offer.requiredDepartment}
                              </span>
                            )}
                            {offer.applicationDeadline && (
                              <span className="text-xs px-2.5 py-1 rounded-full border border-slate-300 text-slate-600 font-medium">
                                Deadline: {offer.applicationDeadline}
                              </span>
                            )}
                          </div>
                          {!isAdmin && (
                            <button
                              onClick={() => setApplyingTo(offer)}
                              disabled={expired}
                              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                            >
                              Apply Now
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Opportunities */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">All Opportunities</h2>
                {filteredOffers.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </div>
                    <p className="text-slate-600 font-medium">No internships available</p>
                    <p className="text-slate-400 text-sm mt-1">Check back later for new opportunities</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredOffers.map((offer) => {
                      const days = daysUntil(offer.applicationDeadline);
                      const expired = days != null && days <= 0;
                      const urgent  = days != null && days > 0 && days <= 7;
                      return (
                        <div key={offer.id} className="bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow p-6">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold mb-4">
                            {(offer.companyName || 'C')[0].toUpperCase()}
                          </div>
                          <h3 className="font-bold text-slate-900 mb-1">{offer.title}</h3>
                          <p className="text-sm text-slate-600 mb-3">{offer.companyName}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {offer.requiredDepartment && (
                              <span className="text-xs px-2.5 py-1 rounded-full border border-slate-300 text-slate-600">
                                {offer.requiredDepartment}
                              </span>
                            )}
                            {offer.durationMonths && (
                              <span className="text-xs px-2.5 py-1 rounded-full border border-slate-300 text-slate-600">
                                {offer.durationMonths}mo
                              </span>
                            )}
                            {days != null && (
                              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                                expired ? 'border-slate-200 text-slate-400'
                                : urgent ? 'border-red-200 text-red-600'
                                : 'border-slate-300 text-slate-600'
                              }`}>
                                {expired ? 'Expired' : `${days}d left`}
                              </span>
                            )}
                          </div>
                          {offer.applicationDeadline && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                              </svg>
                              <span>Deadline: {offer.applicationDeadline}</span>
                            </div>
                          )}
                          {!isAdmin && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setViewingOffer(offer)}
                                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-sm font-semibold transition"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => setApplyingTo(offer)}
                                disabled={expired}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-xl text-sm font-semibold transition"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MY APPLICATIONS TAB ── */}
      {tab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Application Tracker</h2>

          {myApps.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No applications yet</p>
              <p className="text-slate-400 text-sm mt-1">Browse opportunities and apply to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {myApps.map((app) => {
                const cfg = getStepInfo(app.status);
                const currentStep = cfg.step;
                const isAccepted = app.status === 'ACCEPTED';
                const isRefused  = app.status === 'REJECTED' || app.status === 'WITHDRAWN';
                const barColor   = isAccepted ? 'bg-green-500' : isRefused ? 'bg-red-500' : 'bg-blue-500';

                return (
                  <div key={app.id} className="border-b border-slate-200 pb-6 last:border-0 last:pb-0">
                    {/* App header */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <h3 className="font-bold text-slate-900">{app.offerTitle}</h3>
                        <p className="text-sm text-slate-600">{app.companyName}</p>
                        {app.appliedAt && (
                          <p className="text-xs text-slate-400 mt-1">Applied on {app.appliedAt?.split('T')[0]}</p>
                        )}
                        {app.adminNote && (
                          <p className="text-xs text-slate-500 mt-1 italic">"{app.adminNote}"</p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full text-white ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="relative">
                      <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200">
                        <div className={`h-full transition-all ${barColor}`} style={{ width: `${(currentStep / 3) * 100}%` }}/>
                      </div>
                      <div className="relative grid grid-cols-4">
                        {STEPS.map((label, idx) => {
                          const done    = idx < currentStep;
                          const active  = idx === currentStep;
                          const isFinal = idx === 3;
                          const stepAccepted = isFinal && isAccepted;
                          const stepRefused  = isFinal && isRefused;

                          const circleColor = (done || active)
                            ? stepAccepted ? 'bg-green-500 text-white'
                            : stepRefused  ? 'bg-red-500 text-white'
                            : 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-400';

                          const textColor = (done || active)
                            ? stepAccepted ? 'text-green-600'
                            : stepRefused  ? 'text-red-600'
                            : 'text-blue-600'
                            : 'text-slate-400';

                          return (
                            <div key={idx} className="flex flex-col items-center">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all ${circleColor} ${active ? 'ring-4 ring-blue-100' : ''}`}>
                                {idx === 0 && <CheckIcon/>}
                                {idx === 1 && <EyeIcon/>}
                                {idx === 2 && <ChatIcon/>}
                                {idx === 3 && (stepRefused ? <XIcon/> : <CheckIcon/>)}
                              </div>
                              <span className={`mt-2 text-sm text-center font-medium ${textColor}`}>
                                {isFinal
                                  ? stepAccepted ? 'Accepted' : stepRefused ? 'Refused' : 'Decision'
                                  : label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {app.cvDownloadUrl && (
                      <a
                        href={`${process.env.REACT_APP_API_URL || 'http://localhost:8081'}${app.cvDownloadUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-4"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        </svg>
                        {app.cvFileName || 'Download CV'}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VIEW DETAILS MODAL ── */}
      {viewingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewingOffer(null)}/>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {(viewingOffer.companyName || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{viewingOffer.title}</h2>
                  <p className="text-sm text-slate-600 mt-0.5">{viewingOffer.companyName}</p>
                </div>
              </div>
              <button onClick={() => setViewingOffer(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
                <XIcon/>
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {viewingOffer.requiredDepartment && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-300 text-blue-700 font-medium">
                  {viewingOffer.requiredDepartment}
                </span>
              )}
              {viewingOffer.targetYear && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 border border-purple-300 text-purple-700 font-medium">
                  {viewingOffer.targetYear} Year
                </span>
              )}
              {viewingOffer.internshipType && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-300 text-green-700 font-medium capitalize">
                  {viewingOffer.internshipType}
                </span>
              )}
              {viewingOffer.durationMonths > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full border border-slate-300 text-slate-600 font-medium">
                  {viewingOffer.durationMonths} months
                </span>
              )}
              {viewingOffer.applicationDeadline && (
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  daysUntil(viewingOffer.applicationDeadline) <= 0
                    ? 'border-slate-200 text-slate-400'
                    : daysUntil(viewingOffer.applicationDeadline) <= 7
                    ? 'border-red-200 text-red-600'
                    : 'border-slate-300 text-slate-600'
                }`}>
                  {daysUntil(viewingOffer.applicationDeadline) <= 0
                    ? 'Expired'
                    : `Deadline: ${viewingOffer.applicationDeadline}`}
                </span>
              )}
            </div>

            {/* Description */}
            {viewingOffer.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">About this internship</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{viewingOffer.description}</p>
              </div>
            )}

            {/* Requirements */}
            {viewingOffer.requiredSpeciality && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Required Speciality</h3>
                <p className="text-sm text-slate-600">{viewingOffer.requiredSpeciality}</p>
              </div>
            )}

            {/* Actions */}
            {!isAdmin && (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setApplyingTo(viewingOffer); setViewingOffer(null); }}
                  disabled={daysUntil(viewingOffer.applicationDeadline) != null && daysUntil(viewingOffer.applicationDeadline) <= 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  Apply Now
                </button>
                <button
                  onClick={() => setViewingOffer(null)}
                  className="px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── APPLICATION MODAL ── */}
      {applyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setApplyingTo(null)}/>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6 space-y-6">

            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Apply for Internship</h2>
              <button onClick={() => setApplyingTo(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
                <XIcon/>
              </button>
            </div>

            {/* Internship summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                  {(applyingTo.companyName || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{applyingTo.title}</h3>
                  <p className="text-sm text-slate-600 mb-1">{applyingTo.companyName}</p>
                  {applyingTo.description && (
                    <p className="text-sm text-slate-700">{applyingTo.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* CV upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload CV / Resume <span className="text-red-500">*</span>
              </label>
              <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                cvFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
              }`}>
                <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                </svg>
                <p className="text-sm text-slate-600 mb-1">
                  {cvFile
                    ? <span className="text-green-700 font-medium">{cvFile.name}</span>
                    : <><span className="text-blue-600 font-medium">Click to upload</span> or drag and drop</>}
                </p>
                <p className="text-xs text-slate-500">PDF, DOC, DOCX (Max 5MB)</p>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCvFile(e.target.files[0] || null)}/>
              </label>
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cover Letter</label>
              <textarea
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                placeholder="Write a brief cover letter explaining your interest and qualifications..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setApplyingTo(null); setCoverLetter(''); setCvFile(null); }}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApply(applyingTo.id)}
                disabled={submitting || !cvFile}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipsPage;
