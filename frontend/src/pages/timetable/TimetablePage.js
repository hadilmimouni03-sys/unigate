import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { timetableApi } from '../../services/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABEL = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat' };
const DAY_FULL  = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday' };

const TIME_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00'];

const SLOT_STYLE = {
  LECTURE: { bg: 'bg-blue-50',   border: 'border-blue-300',   badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',   print: '#dbeafe' },
  TD:      { bg: 'bg-green-50',  border: 'border-green-300',  badge: 'bg-green-100 text-green-700',   dot: 'bg-green-500',  print: '#dcfce7' },
  TP:      { bg: 'bg-violet-50', border: 'border-violet-300', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', print: '#ede9fe' },
};

const DEFAULT_STYLE = { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', print: '#f8fafc' };

const getTimeRow = (startTime) => {
  if (!startTime) return -1;
  const hour = parseInt(('' + startTime).split(':')[0], 10);
  return TIME_SLOTS.findIndex((t) => parseInt(t.split(':')[0], 10) === hour);
};

const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toUpperCase();

function buildPrintHTML(slots, groupName) {
  const activeDays = DAYS.filter((d) => slots.some((s) => s.dayOfWeek === d));
  const headerCols = activeDays.map((d) => `<th style="background:#f1f5f9;padding:8px 12px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#475569;border:1px solid #e2e8f0">${DAY_FULL[d]}</th>`).join('');
  const rows = TIME_SLOTS.map((_, rowIdx) => {
    const timeLabel = `${TIME_SLOTS[rowIdx]}&ndash;${TIME_SLOTS[rowIdx + 1] || '18:00'}`;
    const cells = activeDays.map((day) => {
      const slot = slots.find((s) => s.dayOfWeek === day && getTimeRow(s.startTime) === rowIdx);
      if (!slot) return `<td style="border:1px solid #e2e8f0;padding:6px;min-height:70px;"></td>`;
      const color = (SLOT_STYLE[slot.slotType] || DEFAULT_STYLE).print;
      return `<td style="border:1px solid #e2e8f0;padding:6px;background:${color};vertical-align:top">
        <div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:2px">${slot.courseName || ''}</div>
        <div style="font-size:10px;color:#64748b">${('' + slot.startTime).slice(0, 5)} &ndash; ${('' + slot.endTime).slice(0, 5)}</div>
        ${slot.room ? `<div style="font-size:10px;color:#94a3b8">Room: ${slot.room}</div>` : ''}
        ${slot.instructor ? `<div style="font-size:10px;color:#94a3b8">${slot.instructor}</div>` : ''}
        <span style="display:inline-block;margin-top:4px;padding:1px 6px;border-radius:9999px;background:#e2e8f0;font-size:9px;font-weight:700;color:#475569">${slot.slotType}</span>
      </td>`;
    }).join('');
    return `<tr>
      <td style="background:#f8fafc;border:1px solid #e2e8f0;padding:6px 10px;text-align:center;font-size:11px;font-weight:600;color:#64748b;white-space:nowrap">${timeLabel}</td>
      ${cells}
    </tr>`;
  }).join('');
  const courses = [...new Map(slots.map((s) => [s.courseName, s])).values()];
  const legend = courses.map((s) => {
    const color = (SLOT_STYLE[s.slotType] || DEFAULT_STYLE).print;
    return `<span style="display:inline-flex;align-items:center;gap:6px;margin-right:12px;font-size:11px">
      <span style="width:10px;height:10px;border-radius:50%;background:${color};border:1px solid #cbd5e1;display:inline-block"></span>
      ${s.courseName} (${s.slotType})
    </span>`;
  }).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Timetable — ${groupName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
    @media print {
      body { padding: 12px; }
      @page { margin: 1cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div style="margin-bottom:16px">
    <h1 style="font-size:20px;font-weight:700;color:#0f172a">Weekly Timetable</h1>
    <p style="font-size:13px;color:#64748b;margin-top:4px">Group: <strong>${groupName}</strong> &nbsp;·&nbsp; Printed on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px">
    <thead>
      <tr>
        <th style="background:#f1f5f9;padding:8px 12px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#475569;border:1px solid #e2e8f0;width:80px">Time</th>
        ${headerCols}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0">
    <p style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Courses</p>
    <div>${legend}</div>
  </div>
</body>
</html>`;
}

function exportPDF(slots, groupName) {
  const win = window.open('', '_blank');
  if (!win) { alert('Please allow pop-ups to export the timetable.'); return; }
  win.document.write(buildPrintHTML(slots, groupName));
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

const TimetablePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const [groups,   setGroups]   = useState([]);
  const [groupId,  setGroupId]  = useState('');
  const [slots,    setSlots]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ courseId: '', dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '10:00', room: '', instructor: '', slotType: 'LECTURE' });
  const [formSaving, setFormSaving] = useState(false);
  const [formError,  setFormError]  = useState('');

  useEffect(() => {
    if (isStudent) return;
    timetableApi.getGroups()
      .then(({ data }) => {
        const sorted = [...data].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
        setGroups(sorted);
      })
      .catch(() => {});
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent) return;
    setLoading(true);
    setError('');
    timetableApi.getMy()
      .then(({ data }) => setSlots(data))
      .catch(() => setError('Could not load your timetable. Please try again later.'))
      .finally(() => setLoading(false));
  }, [isStudent]);

  const load = async (id) => {
    if (!id) { setSlots([]); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await timetableApi.getByGroup(id);
      setSlots(data);
    } catch {
      setError('No timetable found for this group.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (e) => {
    const id = e.target.value;
    setGroupId(id);
    load(id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await timetableApi.delete(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('Failed to delete slot.');
    }
  };

  const handleAddSlot = async () => {
    if (!form.courseId || !groupId) { setFormError('Select a group and enter a Course ID.'); return; }
    setFormSaving(true);
    setFormError('');
    try {
      const { data } = await timetableApi.create({ ...form, courseId: Number(form.courseId), groupId: Number(groupId) });
      setSlots((prev) => [...prev, data]);
      setShowForm(false);
      setForm({ courseId: '', dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '10:00', room: '', instructor: '', slotType: 'LECTURE' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create slot.');
    } finally {
      setFormSaving(false);
    }
  };

  const selectedGroup = groups.find((g) => String(g.id) === String(groupId));
  const groupName = selectedGroup?.name || slots[0]?.groupName || '';
  const activeDays = DAYS.filter((d) => slots.some((s) => s.dayOfWeek === d));
  const getSlot = (day, rowIdx) =>
    slots.find((s) => s.dayOfWeek === day && getTimeRow(s.startTime) === rowIdx) || null;

  const yearLevels = [...new Set(groups.map((g) => g.year))].sort();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
          <p className="text-slate-500 text-sm mt-0.5">View and manage weekly class schedules</p>
        </div>
        {slots.length > 0 && (
          <button
            onClick={() => exportPDF(slots, groupName)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
            </svg>
            Export PDF
          </button>
        )}
      </div>

      {!isStudent && (
        <div className="max-w-sm">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Class Group</label>
          <div className="relative">
            <select
              value={groupId}
              onChange={handleGroupChange}
              className="w-full h-10 pl-3 pr-8 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
            >
              <option value="">— Choose a group —</option>
              {yearLevels.map((year) => (
                <optgroup key={year} label={`Year ${year}`}>
                  {groups.filter((g) => g.year === year).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}{g.department ? ` · ${g.department}` : ''}{g.semester ? ` · ${g.semester}` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          {loading && (
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block"/>
              Loading timetable…
            </p>
          )}
        </div>
      )}

      {isStudent && loading && (
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block"/>
          Loading your timetable…
        </p>
      )}

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
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: 'Sessions / week', value: slots.length },
              { label: 'Active days',     value: activeDays.length },
              { label: 'Group',           value: groupName },
              ...(selectedGroup?.year ? [{ label: 'Year', value: `Year ${selectedGroup.year}` }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-3 flex items-center gap-3">
                <span className="text-xl font-bold text-slate-900">{value}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                Add Slot
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {Object.entries(SLOT_STYLE).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-slate-500 font-medium">{type}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: '72px repeat(6, 1fr)' }}>
              <div className="bg-slate-50 border-r border-slate-100" />
              {DAYS.map((day) => {
                const isToday = day === today;
                return (
                  <div key={day} className={`py-3 px-2 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-blue-50' : 'bg-slate-50'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{DAY_LABEL[day]}</p>
                    {isToday && <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-1" />}
                  </div>
                );
              })}
            </div>

            {TIME_SLOTS.map((_, rowIdx) => (
              <div key={rowIdx} className="grid border-b border-slate-50 last:border-b-0" style={{ gridTemplateColumns: '72px repeat(6, 1fr)' }}>
                <div className="border-r border-slate-100 bg-slate-50/50 flex items-center justify-center py-4 px-1">
                  <span className="text-xs text-slate-400 font-medium text-center leading-tight">
                    {TIME_SLOTS[rowIdx]}<br/><span className="text-slate-300">–</span><br/>{TIME_SLOTS[rowIdx + 1] || '18:00'}
                  </span>
                </div>
                {DAYS.map((day) => {
                  const isToday = day === today;
                  const slot = getSlot(day, rowIdx);
                  const cfg = slot ? (SLOT_STYLE[slot.slotType] || DEFAULT_STYLE) : null;
                  return (
                    <div key={day} className={`border-r border-slate-100 last:border-r-0 p-2 min-h-[88px] ${isToday ? 'bg-blue-50/30' : ''}`}>
                      {slot && cfg ? (
                        <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-2.5 h-full flex flex-col gap-1 ${isToday ? 'ring-1 ring-blue-200' : ''} group relative`}>
                          <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{slot.courseName}</p>
                          <p className="text-xs text-slate-500">{('' + slot.startTime).slice(0,5)} – {('' + slot.endTime).slice(0,5)}</p>
                          {slot.room && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                              {slot.room}
                            </p>
                          )}
                          {slot.instructor && <p className="text-xs text-slate-400 truncate">{slot.instructor}</p>}
                          <span className={`mt-auto inline-block text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{slot.slotType}</span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(slot.id)}
                              className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-xs items-center justify-center hidden group-hover:flex transition"
                            >×</button>
                          )}
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

      {isStudent && !loading && !error && slots.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Your timetable will appear here once you are assigned to a class group.</p>
          <p className="text-slate-400 text-sm mt-1">Contact your administrator if your timetable is not showing after approval.</p>
        </div>
      )}

      {!isStudent && !loading && !error && slots.length === 0 && groupId && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 font-medium">No slots configured for this group yet.</p>
          {isAdmin && <p className="text-slate-400 text-sm mt-1">Use "Add Slot" after selecting a group to build the timetable.</p>}
        </div>
      )}

      {!isStudent && !loading && !error && !groupId && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Select a class group to view its timetable</p>
          {isAdmin && <p className="text-slate-400 text-sm mt-1">You can then add or delete slots for that group.</p>}
        </div>
      )}

      {isAdmin && showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add Timetable Slot</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {groupName && (
              <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium">
                Adding to: {groupName}
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{formError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Course ID</label>
                <input type="number" value={form.courseId} onChange={(e) => setForm((f) => ({...f, courseId: e.target.value}))}
                  placeholder="e.g. 1"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Day</label>
                <select value={form.dayOfWeek} onChange={(e) => setForm((f) => ({...f, dayOfWeek: e.target.value}))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white">
                  {DAYS.map((d) => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({...f, startTime: e.target.value}))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({...f, endTime: e.target.value}))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                <select value={form.slotType} onChange={(e) => setForm((f) => ({...f, slotType: e.target.value}))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white">
                  {['LECTURE', 'TD', 'TP'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Room <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" value={form.room} onChange={(e) => setForm((f) => ({...f, room: e.target.value}))}
                  placeholder="e.g. B201"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Instructor <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="text" value={form.instructor} onChange={(e) => setForm((f) => ({...f, instructor: e.target.value}))}
                  placeholder="e.g. Dr. Smith"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleAddSlot} disabled={formSaving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition">
                {formSaving ? 'Saving…' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
