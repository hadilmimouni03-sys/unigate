import React, { useState } from 'react';

const uid = () => Math.random().toString(36).slice(2);

const DEFAULT_COURSES = [
  { id: '1', name: 'Mathematics',    credits: 6, cc: 40, exam: 60, tp: 0,  hasTP: false },
  { id: '2', name: 'Computer Science', credits: 4, cc: 30, exam: 50, tp: 20, hasTP: true  },
  { id: '3', name: 'Physics',         credits: 4, cc: 40, exam: 60, tp: 0,  hasTP: false },
  { id: '4', name: 'English',         credits: 2, cc: 50, exam: 50, tp: 0,  hasTP: false },
  { id: '5', name: 'Data Structures', credits: 4, cc: 30, exam: 50, tp: 20, hasTP: true  },
];

const Toggle = ({ on, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`relative w-9 h-5 rounded-full transition shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-200'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
  </button>
);

const GradeConfigPage = () => {
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [saved, setSaved] = useState(false);
  const [calcInputs, setCalcInputs] = useState({ cc: '', exam: '', tp: '' });
  const [calcResult, setCalcResult] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(DEFAULT_COURSES[0].id);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const update = (id, field, value) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    setSaved(false);
  };

  const totalWeight = (c) => c.cc + c.exam + (c.hasTP ? c.tp : 0);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCalc = () => {
    const cc   = parseFloat(calcInputs.cc)   || 0;
    const exam = parseFloat(calcInputs.exam) || 0;
    const tp   = parseFloat(calcInputs.tp)   || 0;
    const result =
      (selectedCourse.cc   / 100) * cc +
      (selectedCourse.exam / 100) * exam +
      (selectedCourse.hasTP ? (selectedCourse.tp / 100) * tp : 0);
    setCalcResult(Math.round(result * 100) / 100);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grade Configuration</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure assessment weights and credits for each course</p>
        </div>
        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saved ? '✓ Saved' : 'Save All Changes'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Course Weights</h2>
          <button
            onClick={() => setCourses((p) => [...p, { id: uid(), name: 'New Course', credits: 2, cc: 40, exam: 60, tp: 0, hasTP: false }])}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Add Course
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Course', 'Credits', 'CC %', 'Exam %', 'Has TP', 'TP %', 'Total', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {courses.map((c) => {
                const total = totalWeight(c);
                const ok = Math.abs(total - 100) < 0.01;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <input type="text" value={c.name} onChange={(e) => update(c.id, 'name', e.target.value)}
                        className="w-40 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="1" max="30" value={c.credits} onChange={(e) => update(c.id, 'credits', parseInt(e.target.value) || 1)}
                        className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="0" max="100" step="5" value={c.cc} onChange={(e) => update(c.id, 'cc', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="0" max="100" step="5" value={c.exam} onChange={(e) => update(c.id, 'exam', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                    </td>
                    <td className="px-4 py-3">
                      <Toggle on={c.hasTP} onToggle={() => update(c.id, 'hasTP', !c.hasTP)}/>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min="0" max="100" step="5" value={c.tp} disabled={!c.hasTP}
                        onChange={(e) => update(c.id, 'tp', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"/>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${ok ? 'text-green-600' : 'text-red-500'}`}>{total}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setCourses((p) => p.filter((x) => x.id !== c.id))}
                        className="text-slate-300 hover:text-red-400 transition p-1 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {courses.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">No courses configured. Click "Add Course" to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-5">Grade Calculator</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => { setSelectedCourseId(e.target.value); setCalcResult(null); }}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['CC', 'cc'], ['Exam', 'exam'], ['TP', 'tp']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
                  <input
                    type="number" min="0" max="20" step="0.25" placeholder="—"
                    disabled={key === 'tp' && !selectedCourse?.hasTP}
                    value={calcInputs[key]}
                    onChange={(e) => setCalcInputs((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full text-center border border-slate-200 rounded-xl py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1 text-center">
                    {key === 'cc' ? selectedCourse?.cc : key === 'exam' ? selectedCourse?.exam : selectedCourse?.hasTP ? selectedCourse?.tp : 0}%
                  </p>
                </div>
              ))}
            </div>
            <button onClick={handleCalc} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
              Calculate Grade
            </button>
          </div>

          <div className="flex items-center justify-center">
            {calcResult !== null ? (
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide font-semibold">Final Grade</p>
                <p className={`text-6xl font-bold ${calcResult >= 14 ? 'text-green-600' : calcResult >= 10 ? 'text-blue-600' : 'text-red-500'}`}>
                  {calcResult.toFixed(2)}
                </p>
                <p className="text-slate-400 text-sm mt-1">/20</p>
                <span className={`inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-bold ${calcResult >= 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {calcResult >= 14 ? 'Excellent' : calcResult >= 10 ? 'Pass' : 'Fail'}
                </span>
              </div>
            ) : (
              <div className="text-center text-slate-300">
                <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M16 3l3 3-8 8H8v-3l8-8z"/>
                </svg>
                <p className="text-sm">Enter grades to see the result</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeConfigPage;
