import React, { useState, useEffect } from 'react';
import { internshipApi } from '../../services/api';
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

const InternshipsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [offers, setOffers]             = useState([]);
  const [search, setSearch]             = useState('');
  const [levelFilter, setLevelFilter]   = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all');
  const [viewingOffer, setViewingOffer] = useState(null);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    setLoading(true);
    internshipApi.getOffers()
      .then(({ data }) => setOffers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Internships & Opportunities</h1>
        <p className="text-slate-500">Discover internships tailored for you</p>
      </div>

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
        <div className="space-y-8">

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
                  const days    = daysUntil(offer.applicationDeadline);
                  const expired = days != null && days <= 0;
                  const urgent  = days != null && days > 0 && days <= 7;
                  return (
                    <div key={offer.id} className="bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow p-6 flex flex-col">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold mb-4">
                        {(offer.companyName || 'C')[0].toUpperCase()}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{offer.title}</h3>
                      <p className="text-sm text-slate-600 mb-3">{offer.companyName}</p>
                      <div className="flex flex-wrap gap-2 mb-4 flex-1">
                        {offer.requiredDepartment && (
                          <span className="text-xs px-2.5 py-1 rounded-full border border-slate-300 text-slate-600 h-fit">
                            {offer.requiredDepartment}
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

            {/* Required speciality */}
            {viewingOffer.requiredSpeciality && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Required Speciality</h3>
                <p className="text-sm text-slate-600">{viewingOffer.requiredSpeciality}</p>
              </div>
            )}

            {/* Enterprise contact */}
            {(viewingOffer.contactEmail || viewingOffer.companyWebsite || viewingOffer.location) && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Enterprise Contact</h3>
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
              </div>
            )}

            <button
              onClick={() => setViewingOffer(null)}
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipsPage;
