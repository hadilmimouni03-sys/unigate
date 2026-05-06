import React, { useState, useEffect } from 'react';
import { gradeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const uid = () => Math.random().toString(36).slice(2);

const Toggle = ({ on, onToggle }) => (
  <button type="button" onClick={onToggle}
    className={`relative w-9 h-5 rounded-full transition shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-200'}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`}/>
  </button>
);

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
  </div>
);

const GradeConfigPage = () => {
  const { user } = useAuth();
  const [courses, setCourses]       = useState([]);
  const [semester, setSemester]     = useState('all');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [feedback, setFeedback]     = useState(null);

  const dept = user?.department;

  useEffect(() => {
    if (!dept) return;
    setLoading(true);
    gradeApi.getConfig(dept, semester !== 'all' ? parseInt(semester) : undefined)
      .then(({ data }) => {
        setCourses(data.map((c) => ({ ...c, hasTP: c.tpWeight > 0, _key: c.id || uid() })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dept, semester]);

  const update = (key, field, value) => {
    setCourses((prev) => prev.map((c) => c._key === key ? { ...c, [field]: value } : c));
    setSaved(false);
  };

  const addCourse = () => {
    setCourses((prev) => [...prev, {
      _key: uid(), id: null, moduleCode: '', moduleName: '',
      department: dept, ccWeight: 40, examWeight: 60, tpWeight: 0,
      hasTP: false, credits: 3, semester: semester !== 'all' ? parseInt(semester) : 1,
    }]);
    setSaved(false);
  };

  const removeCourse = (key) => {
    setCourses((prev) => prev.filter((c) => c._key !== key));
    setSaved(false);
  };

  const totalWeight = (c) => c.ccWeight + c.examWeight + (c.hasTP ? c.tpWeight : 0);

  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = async () => {
    const invalid = courses.some((c) => Math.abs(totalWeight(c) - 100) > 0.1 || !c.moduleCode || !c.moduleName);
    if (invalid) {
      notify('Fix validation errors before saving (weights must sum to 100%, module code and name required).', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = courses.map((c) => ({
        id: c.id || undefined,
        moduleCode: c.moduleCode,
        moduleName: c.moduleName,
        department: dept,
        ccWeight: c.ccWeight,
        examWeight: c.examWeight,
        tpWeight: c.hasTP ? c.tpWeight : 0,
        credits: c.credits,
        semester: c.semester,
      }));
      const { data } = await gradeApi.saveConfig(payload);
      setCourses(data.map((c) => ({ ...c, hasTP: c.tpWeight > 0, _key: c.id || uid() })));
      setSaved(true);
      notify('Configuration saved!');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      notify('Failed to save configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grade Configuration</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {dept ? `Department: ${dept}` : 'Configure assessment weights and credits per module'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Semester filter */}
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
            }`}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Table */}
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Module Weights</h2>
            <button onClick={addCourse}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              Add Module
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Code', 'Module Name', 'Credits', 'Sem.', 'CC %', 'Exam %', 'Has TP', 'TP %', 'Total', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {courses.map((c) => {
                  const total = totalWeight(c);
                  const ok = Math.abs(total - 100) < 0.1;
                  return (
                    <tr key={c._key} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <input type="text" value={c.moduleCode} onChange={(e) => update(c._key, 'moduleCode', e.target.value)}
                          placeholder="MATH101"
                          className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={c.moduleName} onChange={(e) => update(c._key, 'moduleName', e.target.value)}
                          placeholder="Mathematics"
                          className="w-36 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="1" max="30" value={c.credits} onChange={(e) => update(c._key, 'credits', parseInt(e.target.value) || 1)}
                          className="w-14 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <select value={c.semester} onChange={(e) => update(c._key, 'semester', parseInt(e.target.value))}
                          className="w-14 border border-slate-200 rounded-lg px-1 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                          <option value={1}>S1</option>
                          <option value={2}>S2</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="100" step="5" value={c.ccWeight} onChange={(e) => update(c._key, 'ccWeight', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="100" step="5" value={c.examWeight} onChange={(e) => update(c._key, 'examWeight', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                      </td>
                      <td className="px-4 py-3">
                        <Toggle on={c.hasTP} onToggle={() => update(c._key, 'hasTP', !c.hasTP)}/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min="0" max="100" step="5" value={c.tpWeight} disabled={!c.hasTP}
                          onChange={(e) => update(c._key, 'tpWeight', parseFloat(e.target.value) || 0)}
                          className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"/>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${ok ? 'text-green-600' : 'text-red-500'}`}>{total}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeCourse(c._key)}
                          className="text-slate-300 hover:text-red-400 transition p-1 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {courses.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No modules configured. Click "Add Module" to get started.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 flex gap-3">
        <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p className="text-xs text-blue-700">
          CC + Exam + TP weights must sum to 100% per module. Students in your department will see these modules and can enter their CC/Exam/TP grades.
        </p>
      </div>
    </div>
  );
};

export default GradeConfigPage;
