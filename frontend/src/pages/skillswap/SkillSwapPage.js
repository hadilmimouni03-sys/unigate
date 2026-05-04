import React, { useState, useEffect } from 'react';
import { skillSwapApi } from '../../services/api';

const MatchCircle = ({ score }) => {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#3b82f6' : '#f59e0b';
  const track = pct >= 70 ? '#dcfce7' : pct >= 40 ? '#dbeafe' : '#fef3c7';
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="-rotate-90 w-14 h-14" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke={track} strokeWidth="3.5"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${pct * 0.879} 100`} strokeLinecap="round"/>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
};

const SkillChip = ({ label, variant = 'offer' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'offer' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
  }`}>
    {label}
  </span>
);

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const SkillSwapPage = () => {
  const [tab, setTab] = useState('marketplace');
  const [offers, setOffers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [mySwaps, setMySwaps] = useState([]);
  const [offerForm, setOfferForm] = useState({ skillsOffered: '', skillsWanted: '', description: '', availability: '' });
  const [requestMsg, setRequestMsg] = useState('');
  const [requestingId, setRequestingId] = useState(null);
  const [feedback, setFeedback] = useState({ msg: '', type: 'info' });
  const [loading, setLoading] = useState(false);

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

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    try {
      await skillSwapApi.createOrUpdateOffer({
        skillsOffered: offerForm.skillsOffered.split(',').map((s) => s.trim()).filter(Boolean),
        skillsWanted: offerForm.skillsWanted.split(',').map((s) => s.trim()).filter(Boolean),
        description: offerForm.description,
        availability: offerForm.availability,
      });
      notify('Profile saved successfully!');
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

  const TABS = [
    ['marketplace', 'Marketplace'],
    ['matches', 'My Matches'],
    ['offer', 'My Profile'],
    ['my-swaps', 'My Sessions'],
  ];

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Peer Learning</h1>
      <p className="text-gray-500 text-sm mb-6">Connect with fellow students to share and learn skills</p>

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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Marketplace */}
      {tab === 'marketplace' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500">No offers in the marketplace yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offers.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{o.studentName}</p>
                      {o.availability && <p className="text-xs text-gray-400 mt-0.5">{o.availability}</p>}
                    </div>
                    {o.averageRating && (
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 shrink-0">
                        <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span className="text-xs font-semibold text-amber-700">{o.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {o.skillsOffered?.map((s) => <SkillChip key={s} label={s} variant="offer"/>)}
                  </div>
                  {o.skillsWanted?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Wants to learn:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {o.skillsWanted.map((s) => <SkillChip key={s} label={s} variant="want"/>)}
                      </div>
                    </div>
                  )}

                  {requestingId === o.id ? (
                    <div className="border-t border-gray-100 pt-3 flex gap-2">
                      <input
                        type="text"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Message (optional)"
                        value={requestMsg}
                        onChange={(e) => setRequestMsg(e.target.value)}
                      />
                      <button onClick={() => handleRequest(o.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
                        Send
                      </button>
                      <button onClick={() => setRequestingId(null)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRequestingId(o.id)}
                      className="mt-auto w-full border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Matches */}
      {tab === 'matches' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-gray-500 text-sm">No matches found. Set up your profile first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex gap-4">
                  {o.matchScore != null && <MatchCircle score={o.matchScore}/>}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{o.studentName}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {o.skillsOffered?.map((s) => <SkillChip key={s} label={s} variant="offer"/>)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {o.skillsWanted?.map((s) => <SkillChip key={s} label={s} variant="want"/>)}
                    </div>
                    <button
                      onClick={() => { setTab('marketplace'); setRequestingId(o.id); }}
                      className="mt-3 text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      Connect →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Offer */}
      {tab === 'offer' && (
        <div className="max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-5">Set Up Your Learning Profile</h2>
            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Skills I can teach
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={offerForm.skillsOffered}
                  onChange={(e) => setOfferForm({ ...offerForm, skillsOffered: e.target.value })}
                  placeholder="Java, Python, React (comma-separated)"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Skills I want to learn
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={offerForm.skillsWanted}
                  onChange={(e) => setOfferForm({ ...offerForm, skillsWanted: e.target.value })}
                  placeholder="Machine Learning, SQL (comma-separated)"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Availability
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={offerForm.availability}
                  onChange={(e) => setOfferForm({ ...offerForm, availability: e.target.value })}
                  placeholder="Mon/Wed 14:00–16:00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="Tell others what you can offer and what you're looking for..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My Swaps */}
      {tab === 'my-swaps' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : mySwaps.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-gray-500 text-sm">No sessions yet. Browse the marketplace to connect with peers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySwaps.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                  {s.matchScore != null && <MatchCircle score={s.matchScore}/>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {s.requesterName} <span className="text-gray-400 font-normal">→</span> {s.providerName}
                    </p>
                    {s.message && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">"{s.message}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                    {s.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleRespond(s.id, true)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(s.id, false)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillSwapPage;
