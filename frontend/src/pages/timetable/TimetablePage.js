import React, { useState, useEffect } from 'react';
import { timetableApi } from '../../services/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_SHORT = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat' };

const SLOT_CONFIG = {
  LECTURE: { bg: 'bg-blue-50',   border: 'border-l-blue-500',   badge: 'bg-blue-100 text-blue-700',   label: 'Lecture' },
  TD:      { bg: 'bg-green-50',  border: 'border-l-green-500',  badge: 'bg-green-100 text-green-700', label: 'TD' },
  TP:      { bg: 'bg-violet-50', border: 'border-l-violet-500', badge: 'bg-violet-100 text-violet-700', label: 'TP' },
};

const TimetablePage = () => {
  const [groupId, setGroupId] = useState('');
  const [inputId, setInputId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [today] = useState(new Date().toLocaleString('en-US', { weekday: 'long' }).toUpperCase());

  const load = async () => {
    if (!inputId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await timetableApi.getByGroup(inputId);
      setSlots(data);
      setGroupId(inputId);
    } catch {
      setError('No timetable found for this group ID.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = slots.filter((s) => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  const activeDays = DAYS.filter((d) => byDay[d].length > 0);
  const totalSlots = slots.length;

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Timetable</h1>
      <p className="text-gray-500 text-sm mb-6">View your weekly class schedule</p>

      {/* Search bar */}
      <div className="flex gap-3 mb-6 max-w-sm">
        <input
          type="number"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter Group ID"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button
          onClick={load}
          disabled={loading || !inputId}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>
          ) : 'Load'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {slots.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6 max-w-sm">
            {[
              { label: 'Sessions/week', value: totalSlots },
              { label: 'Active days', value: activeDays.length },
              { label: 'Group', value: `#${groupId}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Timetable grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DAYS.map((day) => {
              const isToday = day === today;
              return (
                <div key={day}>
                  <div className={`flex items-center gap-1.5 mb-2.5 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    <span className="text-xs font-bold uppercase tracking-wide">{DAY_SHORT[day]}</span>
                    {isToday && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"/>}
                  </div>

                  <div className="space-y-2">
                    {byDay[day].length === 0 ? (
                      <div className="border border-dashed border-gray-200 rounded-xl py-6 flex items-center justify-center">
                        <span className="text-xs text-gray-300">—</span>
                      </div>
                    ) : (
                      byDay[day].map((slot) => {
                        const cfg = SLOT_CONFIG[slot.slotType] || { bg: 'bg-gray-50', border: 'border-l-gray-400', badge: 'bg-gray-100 text-gray-600', label: slot.slotType };
                        return (
                          <div
                            key={slot.id}
                            className={`${cfg.bg} ${cfg.border} border-l-4 rounded-xl p-3 ${isToday ? 'ring-1 ring-blue-200' : ''}`}
                          >
                            <p className="text-xs font-bold text-gray-800 leading-tight">{slot.courseName}</p>
                            <p className="text-xs text-gray-500 mt-1">{slot.startTime} – {slot.endTime}</p>
                            {slot.room && (
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                {slot.room}
                              </p>
                            )}
                            {slot.instructor && (
                              <p className="text-xs text-gray-400 truncate">{slot.instructor}</p>
                            )}
                            <span className={`inline-block mt-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && !error && slots.length === 0 && !groupId && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Enter your group ID to view your timetable</p>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
