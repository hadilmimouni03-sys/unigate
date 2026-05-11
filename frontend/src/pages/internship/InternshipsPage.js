import React, { useState, useEffect, useMemo } from 'react';
import { internshipApi, gradeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

const YEAR_OPTIONS   = ['1st Year', '2nd Year', '3rd Year', 'M1', 'M2'];
const TYPE_OPTIONS   = ['Final Year', 'Worker', 'Summer'];
const DEPT_OPTIONS   = ['CS', 'GI', 'RT', 'GE', 'GM'];

const EMPTY_FORM = {
  companyName: '', title: '', description: '', requiredDepartment: '',
  requiredSpeciality: '', targetYear: '', internshipType: '',
  durationMonths: '', minGpa: '', applicationDeadline: '', linkedInUrl: '',
};

// Compute weighted GPA from grade list
function computeGpa(grades) {
  const valid = grades.filter((g) => g.finalMark != null && g.credits > 0);
  if (valid.length === 0) return null;
  const sumWeighted = valid.reduce((s, g) => s + g.finalMark * g.credits, 0);
  const sumCredits  = valid.reduce((s, g) => s + g.credits, 0);
  return sumCredits > 0 ? Math.round((sumWeighted / sumCredits) * 100) / 100 : null;
}

const StatusBadge = ({ status }) => {
  if (status === 'PUBLISHED') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 border border-green-300 text-green-700 font-medium">
        Published
      </span>
    );
  }
  if (status === 'DRAFT') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-500 font-medium">
        Draft
      </span>
    );
  }
  if (status === 'EXPIRED') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-500 font-medium">
        Expired
      </span>
    );
  }
  return null;
};

const InternshipsPage = () => {
  const { user } = useAuth();
  const isAdmin   = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const [offers, setOffers]             = useState([]);
  const [search, setSearch]             = useState('');
  const [levelFilter, setLevelFilter]   = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [viewingOffer, setViewingOffer] = useState(null);
  const [loading, setLoading]           = useState(false);

  // Student GPA (for minGpa check)
  const [studentGpa, setStudentGpa] = useState(null);

  // Create offer modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const loadOffers = () => {
    setLoading(true);
    const fetch = isAdmin ? internshipApi.getAdminOffers() : internshipApi.getOffers();
    fetch
      .then(({ data }) => setOffers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOffers(); }, [isAdmin]);

  // Fetch student GPA once
  useEffect(() => {
    if (!isStudent) return;
    gradeApi.myGrades()
      .then(({ data }) => setStudentGpa(computeGpa(data)))
      .catch(() => {});
  }, [isStudent]);

  const daysUntil = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  // Reactive filtering — recomputes on every state change, no page reload needed
  const filteredOffers = useMemo(() => offers.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || o.title?.toLowerCase().includes(q)
      || o.companyName?.toLowerCase().includes(q)
      || o.description?.toLowerCase().includes(q);
    const matchesLevel = levelFilter === 'all' || o.targetYear === levelFilter;
    const matchesType  = typeFilter  === 'all' || o.internshipType === typeFilter;
    // Admins can also filter drafts; students only see published (API already filters)
    return matchesSearch && matchesLevel && matchesType;
  }), [offers, search, levelFilter, typeFilter]);

  const recommended = filteredOffers.filter((o) => o.status === 'PUBLISHED').slice(0, 3);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.companyName.trim()) {
      setFormError('Title and Company Name are required.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        companyName:         form.companyName.trim(),
        title:               form.title.trim(),
        description:         form.description.trim() || null,
        requiredDepartment:  form.requiredDepartment  || null,
        requiredSpeciality:  form.requiredSpeciality.trim() || null,
        targetYear:          form.targetYear          || null,
        internshipType:      form.internshipType      || null,
        durationMonths:      form.durationMonths ? parseInt(form.durationMonths, 10) : 0,
        minGpa:              form.minGpa ? parseFloat(form.minGpa) : null,
        applicationDeadline: form.applicationDeadline || null,
        linkedInUrl:         form.linkedInUrl.trim()  || null,
      };
      const { data: created } = await internshipApi.createOffer(payload);
      await internshipApi.publishOffer(created.id);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      loadOffers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // GPA eligibility helpers
  const gpaBlock = (offer) =>
    isStudent && offer.minGpa != null && studentGpa != null && studentGpa < offer.minGpa;

  const gpaUnknown = (offer) =>
    isStudent && offer.minGpa != null && studentGpa == null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Internships & Opportunities</h1>
          <p className="text-slate-500">
            {isAdmin ? 'Manage and publish internship offers' : 'Discover internships tailored for you'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowCreate(true); setFormError(''); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Post Offer
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, company, or keyword..."
              className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-11 border border-slate-200 rounded-xl px-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
          >
            <option value="all">All Levels</option>
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 border border-slate-200 rounded-xl px-3 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
          >
            <option value="all">All Types</option>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {(search || levelFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setLevelFilter('all'); setTypeFilter('all'); }}
              className="text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? <Spinner/> : (
        <div className="space-y-8">

          {/* Recommended (students only, published offers) */}
          {!isAdmin && recommended.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                <h2 className="text-2xl font-bold text-slate-900">Recommended for You</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommended.map((offer) => (
                  <div key={offer.id} className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-200 hover:shadow-xl transition-all p-6 flex flex-col">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mb-4">
                      {(offer.companyName || 'C')[0].toUpperCase()}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{offer.title}</h3>
                    <p className="text-slate-600 mb-3">{offer.companyName}</p>
                    {offer.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">{offer.description}</p>
                    )}
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
                    <button
                      onClick={() => setViewingOffer(offer)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Opportunities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {isAdmin ? 'All Offers' : 'All Opportunities'}
              </h2>
              <span className="text-sm text-slate-400">{filteredOffers.length} result{filteredOffers.length !== 1 ? 's' : ''}</span>
            </div>

            {filteredOffers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No internships found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {isAdmin ? 'Click "Post Offer" to add one.' : 'Try adjusting your filters or check back later.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredOffers.map((offer) => {
                  const days    = daysUntil(offer.applicationDeadline);
                  const expired = days != null && days <= 0;
                  const urgent  = days != null && days > 0 && days <= 7;
                  const blocked = gpaBlock(offer);
                  return (
                    <div
                      key={offer.id}
                      className={`bg-white rounded-2xl border transition-shadow p-6 flex flex-col ${
                        blocked ? 'border-amber-200' : 'border-slate-200 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                          {(offer.companyName || 'C')[0].toUpperCase()}
                        </div>
                        {isAdmin && <StatusBadge status={offer.status}/>}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{offer.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{offer.companyName}</p>
                      <div className="flex flex-wrap gap-2 mb-4 flex-1">
                        {offer.targetYear && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 h-fit">
                            {offer.targetYear}
                          </span>
                        )}
                        {offer.internshipType && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 h-fit">
                            {offer.internshipType}
                          </span>
                        )}
                        {offer.durationMonths > 0 && (
                          <span className="text-xs px-2.5 py-1 rounded-full border border-slate-300 text-slate-600 h-fit">
                            {offer.durationMonths}mo
                          </span>
                        )}
                        {days != null && (
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium h-fit ${
                            expired ? 'border-slate-200 text-slate-400'
                            : urgent ? 'border-red-200 text-red-600'
                            : 'border-slate-300 text-slate-600'
                          }`}>
                            {expired ? 'Expired' : `${days}d left`}
                          </span>
                        )}
                      </div>
                      {/* GPA warning on card */}
                      {blocked && (
                        <p className="text-xs text-amber-600 mb-3">
                          Min GPA {offer.minGpa} required (yours: {studentGpa?.toFixed(2)})
                        </p>
                      )}
                      <button
                        onClick={() => setViewingOffer(offer)}
                        className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-sm font-semibold transition"
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">{viewingOffer.title}</h2>
                    {isAdmin && <StatusBadge status={viewingOffer.status}/>}
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{viewingOffer.companyName}</p>
                </div>
              </div>
              <button onClick={() => setViewingOffer(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition shrink-0">
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
                  {viewingOffer.targetYear}
                </span>
              )}
              {viewingOffer.internshipType && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 border border-green-300 text-green-700 font-medium">
                  {viewingOffer.internshipType}
                </span>
              )}
              {viewingOffer.durationMonths > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full border border-slate-300 text-slate-600 font-medium">
                  {viewingOffer.durationMonths} months
                </span>
              )}
              {viewingOffer.minGpa && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-700 font-medium">
                  Min GPA: {viewingOffer.minGpa}
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

            {/* Required speciality */}
            {viewingOffer.requiredSpeciality && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Required Speciality</h3>
                <p className="text-sm text-slate-600">{viewingOffer.requiredSpeciality}</p>
              </div>
            )}

            {/* Contact & Links */}
            {(viewingOffer.contactEmail || viewingOffer.companyWebsite || viewingOffer.location || viewingOffer.linkedInUrl) && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Contact & Links</h3>
                {viewingOffer.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>{viewingOffer.location}</span>
                  </div>
                )}
                {viewingOffer.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <a href={`mailto:${viewingOffer.contactEmail}`} className="text-blue-600 hover:underline">
                      {viewingOffer.contactEmail}
                    </a>
                  </div>
                )}
                {viewingOffer.companyWebsite && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
                      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                    </svg>
                    <a href={viewingOffer.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                      {viewingOffer.companyWebsite}
                    </a>
                  </div>
                )}
                {viewingOffer.linkedInUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76zm13.5 12.27h-3v-5.6c0-3.37-4-3.12-4 0v5.6h-3v-11h3v1.77c1.39-2.58 7-2.77 7 2.47v6.76z"/>
                    </svg>
                    {/* target="_blank" ensures LinkedIn opens in a new tab without leaving UniGate */}
                    <a href={viewingOffer.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View on LinkedIn
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* GPA eligibility warning (students) */}
            {isStudent && viewingOffer.minGpa != null && (
              <div className={`rounded-xl px-4 py-3 text-sm ${
                gpaBlock(viewingOffer)
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : gpaUnknown(viewingOffer)
                  ? 'bg-slate-50 border border-slate-200 text-slate-600'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                {gpaBlock(viewingOffer) && (
                  <>Your current GPA ({studentGpa?.toFixed(2)}/20) is below the minimum required ({viewingOffer.minGpa}/20). You can still apply, but your application may not be considered.</>
                )}
                {gpaUnknown(viewingOffer) && (
                  <>This offer requires a minimum GPA of {viewingOffer.minGpa}/20. Enter your grades in the Grades section to verify your eligibility.</>
                )}
                {!gpaBlock(viewingOffer) && !gpaUnknown(viewingOffer) && (
                  <>Your GPA ({studentGpa?.toFixed(2)}/20) meets the minimum requirement ({viewingOffer.minGpa}/20).</>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setViewingOffer(null)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Close
              </button>
              {isStudent && viewingOffer.status === 'PUBLISHED' && (
                <a
                  href={viewingOffer.linkedInUrl || `mailto:${viewingOffer.contactEmail}`}
                  target={viewingOffer.linkedInUrl ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition ${
                    gpaBlock(viewingOffer)
                      ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed pointer-events-none'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {gpaBlock(viewingOffer) ? 'GPA Too Low' : 'Apply Now'}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE OFFER MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)}/>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-slate-900">Post New Internship Offer</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
                <XIcon/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Software Engineering Intern"
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleFormChange}
                    placeholder="e.g. Acme Corp"
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select
                    name="requiredDepartment"
                    value={form.requiredDepartment}
                    onChange={handleFormChange}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">All Departments</option>
                    {DEPT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Year</label>
                  <select
                    name="targetYear"
                    value={form.targetYear}
                    onChange={handleFormChange}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Any Year</option>
                    {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Internship Type</label>
                  <select
                    name="internshipType"
                    value={form.internshipType}
                    onChange={handleFormChange}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Any Type</option>
                    {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (months)</label>
                  <input
                    name="durationMonths"
                    type="number"
                    min="1"
                    max="24"
                    value={form.durationMonths}
                    onChange={handleFormChange}
                    placeholder="e.g. 3"
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Minimum GPA (out of 20)</label>
                  <input
                    name="minGpa"
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={form.minGpa}
                    onChange={handleFormChange}
                    placeholder="e.g. 12"
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Application Deadline</label>
                  <input
                    name="applicationDeadline"
                    type="date"
                    value={form.applicationDeadline}
                    onChange={handleFormChange}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required Speciality / Domain</label>
                  <input
                    name="requiredSpeciality"
                    value={form.requiredSpeciality}
                    onChange={handleFormChange}
                    placeholder="e.g. AI & Machine Learning, Web Development"
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn Job URL</label>
                  <input
                    name="linkedInUrl"
                    value={form.linkedInUrl}
                    onChange={handleFormChange}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={4}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  {submitting ? 'Publishing...' : 'Post & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipsPage;
