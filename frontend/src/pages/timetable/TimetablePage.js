import React, { useState } from 'react';
import { timetableApi } from '../../services/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABEL = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat' };

const TIME_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00'];

const SLOT_STYLE = {
  LECTURE: { bg: 'bg-blue-50',   border: 'border-blue-300',   badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  TD:      { bg: 'bg-green-50',  border: 'border-green-300',  badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  TP:      { bg: 'bg-violet-50', border: 'border-violet-300', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
};

const DEFAULT_STYLE = { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };

const getTimeRow = (startTime) => {
  if (!startTime) return -1;
  const hour = parseInt(startTime.split(':')[0], 10);
  return TIME_SLOTS.findIndex((t) => parseInt(t.split(':')[0], 10) === hour);
};

const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toUpperCase();

const TimetablePage = () => {
  const [groupId, setGroupId] = useState('');
  const [inputId, setInputId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const activeDays = DAYS.filter((d) => slots.some((s) => s.dayOfWeek === d));

  const getSlot = (day, rowIdx) =>
    slots.find((s) => s.dayOfWeek === day && getTimeRow(s.startTime) === rowIdx) || null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
        <p className="text-slate-500 text-sm mt-0.5">View your weekly class schedule</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 max-w-sm">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="number"
            className="w-full pl-9 pr-4 border border-slate-200 rounded-xl h-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Enter Group ID"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <button
          onClick={load}
          disabled={loading || !inputId}
          className="px-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>
            : 'Load'}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {error}
        </div>
      )}

      {slots.length > 0 && (
        <>
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Sessions / week', value: slots.length },
              { label: 'Active days',     value: activeDays.length },
              { label: 'Group',           value: `#${groupId}` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-3 flex items-center gap-3">
                <span className="text-xl font-bold text-slate-900">{value}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4">
            {Object.entries(SLOT_STYLE).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-slate-500 font-medium">{type}</span>
              </div>
            ))}
          </div>

          {/* Weekly grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '72px repeat(6, 1fr)' }}>
              <div className="bg-slate-50 border-r border-slate-100" />
              {DAYS.map((day) => {
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={`py-3 px-2 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-blue-50' : 'bg-slate-50'}`}
                  >
                    <p className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                      {DAY_LABEL[day]}
                    </p>
                    {isToday && <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-1" />}
                  </div>
                );
              })}
            </div>

            {/* Time rows */}
            {TIME_SLOTS.map((_, rowIdx) => (
              <div
                key={rowIdx}
                className="grid border-b border-slate-50 last:border-b-0"
                style={{ gridTemplateColumns: '72px repeat(6, 1fr)' }}
              >
                {/* Time label */}
                <div className="border-r border-slate-100 bg-slate-50/50 flex items-center justify-center py-4 px-1">
                  <span className="text-xs text-slate-400 font-medium text-center leading-tight">
                    {TIME_SLOTS[rowIdx]}<br/>
                    <span className="text-slate-300">–</span><br/>
                    {TIME_SLOTS[rowIdx + 1] || '18:00'}
                  </span>
                </div>

                {/* Day cells */}
                {DAYS.map((day) => {
                  const isToday = day === today;
                  const slot = getSlot(day, rowIdx);
                  const cfg = slot ? (SLOT_STYLE[slot.slotType] || DEFAULT_STYLE) : null;
                  return (
                    <div
                      key={day}
                      className={`border-r border-slate-100 last:border-r-0 p-2 min-h-[88px] ${isToday ? 'bg-blue-50/30' : ''}`}
                    >
                      {slot && cfg ? (
                        <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-2.5 h-full flex flex-col gap-1 ${isToday ? 'ring-1 ring-blue-200' : ''}`}>
                          <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{slot.courseName}</p>
                          <p className="text-xs text-slate-500">{slot.startTime} – {slot.endTime}</p>
                          {slot.room && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              {slot.room}
                            </p>
                          )}
                          {slot.instructor && (
                            <p className="text-xs text-slate-400 truncate">{slot.instructor}</p>
                          )}
                          <span className={`mt-auto inline-block text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                            {slot.slotType}
                          </span>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-xs text-slate-200">—</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Course list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Courses This Week</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...new Map(slots.map((s) => [s.courseName, s])).values()].map((s) => {
                const cfg = SLOT_STYLE[s.slotType] || DEFAULT_STYLE;
                return (
                  <div key={s.courseName} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.courseName}</p>
                      {s.instructor && <p className="text-xs text-slate-400 truncate">{s.instructor}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>{s.slotType}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!loading && !error && slots.length === 0 && !groupId && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Enter your group ID to view your timetable</p>
          <p className="text-slate-400 text-sm mt-1">Type your group number above and press Load</p>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
