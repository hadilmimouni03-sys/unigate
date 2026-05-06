import React, { useState, useEffect } from 'react';
import { skillSwapApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  PENDING:   'bg-amber-100 text-amber-700',
  ACCEPTED:  'bg-green-100 text-green-700',
  REJECTED:  'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

/* ── SVG circular match-score (score is 0-1 decimal) ── */
const MatchCircle = ({ score }) => {
  const pct = Math.round((score || 0) * 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#2563eb' : '#94a3b8';
  return (
    <div className="text-center shrink-0">
      <div className="relative inline-flex items-center justify-center w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} stroke="#e2e8f0" strokeWidth="4" fill="none"/>
          <circle cx="32" cy="32" r={r} stroke={color} strokeWidth="4" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="text-xs text-slate-500 mt-0.5">Match</div>
    </div>
  );
};

const GreenBadge = ({ label }) => (
  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-300">
    {label}
  </span>
);

const PurpleBadge = ({ label }) => (
  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-300">
    {label}
  </span>
);

const BlueBadge = ({ label }) => (
  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
    {label}
  </span>
);

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
  </div>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <p className="text-slate-600 font-medium">{title}</p>
    {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
  </div>
);

const StarIcon = () => (
  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

const TABS = [
  { key: 'matches',     label: 'Top Matches' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'my-swaps',   label: 'My Sessions' },
];

const SkillSwapPage = () => {
  const { user } = useAuth();

  const [tab, setTab]           = useState('matches');
  const [offers, setOffers]     = useState([]);
  const [matches, setMatches]   = useState([]);
  const [mySwaps, setMySwaps]   = useState([]);
  const [search, setSearch]     = useState('');
  const [editingProfile, setEditingProfile] = useState(false);

  const [offerForm, setOfferForm] = useState({
    skillsOffered: '',
    skillsWanted: '',
    description: '',
    availability: '',
  });

  const [requestMsg, setRequestMsg]     = useState('');
  const [requestingId, setRequestingId] = useState(null);
  const [feedback, setFeedback]         = useState({ msg: '', type: 'info' });
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (tab === 'marketplace') {
      setLoading(true);
      skillSwapApi.getMarketplace().then(({ data }) => setOffers(data)).catch(() => {}).finally(() => setLoading(false));
    } else if (tab === 'matches') {
      setLoading(true);
      skillSwapApi.getMyMatches().then(({ data }) => setMatches(data)).catch(() => {}).finally(() => setLoading(false));
    } else if (tab === 'my-swaps') {
      setLoading(true);
      skillSwapApi.mySwaps().then(({ data }) => setMySwaps(data)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback({ msg: '', type: 'info' }), 3000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await skillSwapApi.createOrUpdateOffer({
        skillsOffered: offerForm.skillsOffered.split(',').map((s) => s.trim()).filter(Boolean),
        skillsWanted:  offerForm.skillsWanted.split(',').map((s) => s.trim()).filter(Boolean),
        description:   offerForm.description,
        availability:  offerForm.availability,
      });
      notify('Profile saved!');
      setEditingProfile(false);
    } catch {
      notify('Failed to save profile.', 'error');
    }
  };

  const handleRequest = async (offerId) => {
    try {
      await skillSwapApi.requestSwap(offerId, requestMsg);
      notify('Connection request sent!');
      setRequestingId(null);
      setRequestMsg('');
    } catch {
      notify('Failed to send request.', 'error');
    }
  };

  const handleRespond = async (swapId, accept) => {
    try {
      await skillSwapApi.respond(swapId, accept, '');
      notify(accept ? 'Session accepted!' : 'Session declined.');
      skillSwapApi.mySwaps().then(({ data }) => setMySwaps(data));
    } catch {
      notify('Action failed.', 'error');
    }
  };

  const teachSkills = offerForm.skillsOffered.split(',').map((s) => s.trim()).filter(Boolean);
  const learnSkills = offerForm.skillsWanted.split(',').map((s) => s.trim()).filter(Boolean);

  const userName     = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'My Profile';
  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'ME';

  const filterItems = (items) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((o) =>
      o.studentName?.toLowerCase().includes(q) ||
      o.department?.toLowerCase().includes(q) ||
      o.skillsOffered?.some((s) => s.toLowerCase().includes(q)) ||
      o.skillsWanted?.some((s) => s.toLowerCase().includes(q))
    );
  };

  const filteredOffers  = filterItems(offers);
  const filteredMatches = filterItems(matches);

  /* ── Match card (shared between matches + marketplace) ── */
  const MatchCard = ({ o, isMatch }) => (
    <div className="bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all p-6">
      {/* Top row: avatar + info + match circle */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shrink-0">
            {(o.studentName || 'S').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{o.studentName}</h3>
            {o.department && (
              <span className="inline-block text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full mt-0.5 mb-1">
                {o.department}
              </span>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {o.averageRating != null && (
                <div className="flex items-center gap-1">
                  <StarIcon />
                  <span className="text-sm font-medium text-slate-700">{o.averageRating.toFixed(1)}</span>
                </div>
              )}
              {o.reviewCount != null && o.reviewCount > 0 && (
                <span className="text-xs text-slate-400">({o.reviewCount} reviews)</span>
              )}
              {o.availability && (
                <span className="text-xs text-slate-400 truncate">{o.availability}</span>
              )}
            </div>
          </div>
        </div>

        {/* Match score */}
        {o.matchScore != null && <MatchCircle score={isMatch ? o.matchScore : o.matchScore / 100} />}
      </div>

      {/* Skills */}
      <div className="space-y-3 mb-4">
        {o.skillsOffered?.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">Can teach you:</div>
            <div className="flex flex-wrap gap-1.5">
              {o.skillsOffered.map((s) => <GreenBadge key={s} label={s}/>)}
            </div>
          </div>
        )}
        {o.skillsWanted?.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1.5">Wants to learn:</div>
            <div className="flex flex-wrap gap-1.5">
              {o.skillsWanted.map((s) => <PurpleBadge key={s} label={s}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Shared time slots */}
      {o.sharedSlots?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-blue-900 mb-1.5 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            Shared free slots:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {o.sharedSlots.map((slot) => <BlueBadge key={slot} label={slot}/>)}
          </div>
        </div>
      )}

      {/* Request form inline */}
      {requestingId === o.id ? (
        <div className="space-y-2">
          <input
            type="text"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Message (optional)"
            value={requestMsg}
            onChange={(e) => setRequestMsg(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => handleRequest(o.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold transition">
              Send Request
            </button>
            <button onClick={() => setRequestingId(null)}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded-xl text-sm font-semibold transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setRequestingId(o.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
        >
          Connect
        </button>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Skill Swap</h1>
          <p className="text-slate-500">Connect with peers to exchange knowledge</p>
        </div>
        <button
          onClick={() => setTab('my-swaps')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          My Connections
        </button>
      </div>

      {/* ── Feedback toast ── */}
      {feedback.msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {feedback.type === 'error'
              ? <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              : <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>}
          </svg>
          {feedback.msg}
        </div>
      )}

      {/* ── My Profile Card ── */}
      {!editingProfile ? (
        <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full ring-4 ring-white bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shrink-0">
              {userInitials}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-slate-900 mb-0.5">{userName}</h3>
              {user?.department && (
                <span className="inline-block text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full mb-1">
                  {user.department}
                </span>
              )}
              <p className="text-slate-600 mb-4 text-sm">
                {user?.role?.replace(/_/g, ' ')} {offerForm.availability && `• ${offerForm.availability}`}
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-2">I can teach:</div>
                  <div className="flex flex-wrap gap-2">
                    {teachSkills.length > 0
                      ? teachSkills.map((s) => (
                          <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">{s}</span>
                        ))
                      : <span className="text-xs text-slate-400">Not set yet</span>}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-2">I want to learn:</div>
                  <div className="flex flex-wrap gap-2">
                    {learnSkills.length > 0
                      ? learnSkills.map((s) => (
                          <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500 text-white">{s}</span>
                        ))
                      : <span className="text-xs text-slate-400">Not set yet</span>}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditingProfile(true)}
              className="border border-slate-300 hover:bg-white text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0"
            >
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Your Learning Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Skills I can teach (comma-separated)</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={offerForm.skillsOffered}
                  onChange={(e) => setOfferForm({ ...offerForm, skillsOffered: e.target.value })}
                  placeholder="React, Python, Java…"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Skills I want to learn (comma-separated)</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={offerForm.skillsWanted}
                  onChange={(e) => setOfferForm({ ...offerForm, skillsWanted: e.target.value })}
                  placeholder="Machine Learning, AWS…"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Availability</label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={offerForm.availability}
                onChange={(e) => setOfferForm({ ...offerForm, availability: e.target.value })}
                placeholder="Mon 14:00-16:00, Wed 16:00-18:00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
              <textarea
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                value={offerForm.description}
                onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                placeholder="What you can offer and what you're looking for…"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">
                Save Profile
              </button>
              <button type="button" onClick={() => setEditingProfile(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-white text-slate-700 rounded-xl text-sm font-semibold transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by skill, name, or department..."
          className="w-full pl-12 pr-4 h-12 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-slate-200 gap-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TOP MATCHES ── */}
      {tab === 'matches' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Top Matches for You</h2>
            {!loading && <div className="text-sm text-slate-500">{filteredMatches.length} matches found</div>}
          </div>

          {loading ? <Spinner /> : filteredMatches.length === 0 ? (
            <EmptyState
              icon={<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
              title="No matches found"
              subtitle="Set up your profile first so we can find you the best peers"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((o) => <MatchCard key={o.id} o={o} isMatch={true}/>)}
            </div>
          )}
        </>
      )}

      {/* ── MARKETPLACE ── */}
      {tab === 'marketplace' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">All Offers</h2>
            {!loading && <div className="text-sm text-slate-500">{filteredOffers.length} offers</div>}
          </div>

          {loading ? <Spinner /> : filteredOffers.length === 0 ? (
            <EmptyState
              icon={<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>}
              title="No offers in the marketplace yet"
              subtitle="Be the first — save your profile to appear here"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOffers.map((o) => <MatchCard key={o.id} o={o} isMatch={false}/>)}
            </div>
          )}
        </>
      )}

      {/* ── MY SESSIONS ── */}
      {tab === 'my-swaps' && (
        <>
          <h2 className="text-xl font-bold text-slate-900">My Sessions</h2>

          {loading ? <Spinner /> : mySwaps.length === 0 ? (
            <EmptyState
              icon={<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>}
              title="No sessions yet"
              subtitle="Connect with peers in Top Matches or Marketplace to start"
            />
          ) : (
            <div className="space-y-3">
              {mySwaps.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
                  {s.matchScore != null && <MatchCircle score={s.matchScore}/>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {s.requesterName} <span className="text-slate-400 font-normal mx-1">→</span> {s.providerName}
                    </p>
                    {s.message && <p className="text-xs text-slate-500 mt-0.5 italic">"{s.message}"</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600'}`}>
                      {s.status}
                    </span>
                    {s.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleRespond(s.id, true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                          Accept
                        </button>
                        <button onClick={() => handleRespond(s.id, false)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default SkillSwapPage;
