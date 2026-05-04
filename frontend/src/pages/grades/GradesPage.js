import React, { useState, useEffect } from 'react';
import { gradeApi } from '../../services/api';

const markColor = (mark) => {
  if (mark == null) return 'text-gray-400';
  if (mark >= 14) return 'text-green-600';
  if (mark >= 10) return 'text-blue-600';
  return 'text-red-500';
};

const GradeRing = ({ mark, max = 20, size = 52 }) => {
  if (mark == null) return <span className="text-sm text-gray-400">—</span>;
  const pct = (mark / max) * 100;
  const color = mark >= 14 ? '#22c55e' : mark >= 10 ? '#3b82f6' : '#ef4444';
  const track = mark >= 14 ? '#dcfce7' : mark >= 10 ? '#dbeafe' : '#fee2e2';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" style={{ width: size, height: size }} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke={track} strokeWidth="3.5"/>
        <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${pct * 0.879} 100`} strokeLinecap="round"/>
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{mark.toFixed(1)}</span>
    </div>
  );
};

const GradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simForm, setSimForm] = useState({ moduleCode: '', ccMark: '', examMark: '' });
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [activeSem, setActiveSem] = useState('all');

  useEffect(() => {
    gradeApi.myGrades()
      .then(({ data }) => setGrades(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSimError('');
    setSimResult(null);
    setSimulating(true);
    try {
      const { data } = await gradeApi.simulate({
        moduleCode: simForm.moduleCode,
        ccMark: parseFloat(simForm.ccMark),
        examMark: parseFloat(simForm.examMark),
      });
      setSimResult(data);
    } catch (err) {
      setSimError(err.response?.data?.message || 'Simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const semesters = [...new Set(grades.map((g) => g.semester))].sort();
  const filtered = activeSem === 'all' ? grades : grades.filter((g) => g.semester === parseInt(activeSem));

  const semGpa = (sem) => {
    const sg = grades.filter((g) => g.semester === sem && g.finalMark != null);
    if (!sg.length) return null;
    const totalCredits = sg.reduce((s, g) => s + (g.credits || 1), 0);
    const weighted = sg.reduce((s, g) => s + g.finalMark * (g.credits || 1), 0);
    return (weighted / totalCredits).toFixed(2);
  };

  const overallAvg = () => {
    const graded = grades.filter((g) => g.finalMark != null);
    if (!graded.length) return null;
    const tc = graded.reduce((s, g) => s + (g.credits || 1), 0);
    const w = graded.reduce((s, g) => s + g.finalMark * (g.credits || 1), 0);
    return (w / tc).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Academic Grades</h1>
      <p className="text-gray-500 text-sm mb-6">Your grades and performance overview</p>

      {/* Stats row */}
      {grades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Overall Average', value: overallAvg() ? `${overallAvg()}/20` : '—', bg: 'from-blue-500 to-indigo-500' },
            { label: 'Modules', value: grades.length, bg: 'from-violet-500 to-purple-500' },
            { label: 'Passed', value: grades.filter((g) => g.passed).length, bg: 'from-green-500 to-emerald-500' },
            { label: 'Failed', value: grades.filter((g) => g.passed === false).length, bg: 'from-red-400 to-rose-500' },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`bg-gradient-to-br ${bg} rounded-2xl p-4 text-white shadow-sm`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs opacity-80 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Semester filter tabs */}
      {semesters.length > 0 && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          <button
            onClick={() => setActiveSem('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              activeSem === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Semesters
          </button>
          {semesters.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSem(String(s))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 ${
                activeSem === String(s) ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              S{s}
              {semGpa(s) && (
                <span className={`${activeSem === String(s) ? 'bg-white/20' : 'bg-gray-200'} rounded-full px-1.5 py-0.5`}>
                  {semGpa(s)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Grades grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-500">No grades recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {filtered.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-600">{g.credits ?? '?'}cr</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{g.moduleName}</p>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">S{g.semester}</span>
                </div>
                {g.requiredExamToPass && g.examMark == null && (
                  <p className="text-xs mt-0.5">
                    <span className="text-gray-400">Need for exam: </span>
                    <span className={g.requiredExamToPass === 'IMPOSSIBLE' ? 'text-red-500 font-semibold' : 'text-gray-700 font-medium'}>
                      {g.requiredExamToPass}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-5 shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="text-xs text-gray-400 mb-0.5">CC</p>
                  <p className={`text-sm font-semibold ${markColor(g.ccMark)}`}>
                    {g.ccMark != null ? g.ccMark.toFixed(1) : '—'}
                  </p>
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-xs text-gray-400 mb-0.5">Exam</p>
                  <p className={`text-sm font-semibold ${markColor(g.examMark)}`}>
                    {g.examMark != null ? g.examMark.toFixed(1) : '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Final</p>
                  <GradeRing mark={g.finalMark} />
                </div>
                <div className="w-14 text-center">
                  {g.passed == null ? (
                    <span className="text-xs text-gray-400">Pending</span>
                  ) : g.passed ? (
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Pass</span>
                  ) : (
                    <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Fail</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade Simulator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{width:'18px',height:'18px'}}>
              <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M16 3l-4 4 4 4M12 7h9"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Grade Simulator</h2>
            <p className="text-xs text-gray-400">Calculate what exam mark you need to pass</p>
          </div>
        </div>

        <form onSubmit={handleSimulate} className="space-y-3 max-w-sm">
          <input
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
            placeholder="Module code (e.g. INFO101)"
            value={simForm.moduleCode}
            onChange={(e) => setSimForm({ ...simForm, moduleCode: e.target.value })}
            required
          />
          <div className="flex gap-3">
            <input
              type="number" min="0" max="20" step="0.01"
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
              placeholder="CC (0–20)"
              value={simForm.ccMark}
              onChange={(e) => setSimForm({ ...simForm, ccMark: e.target.value })}
              required
            />
            <input
              type="number" min="0" max="20" step="0.01"
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
              placeholder="Exam (0–20)"
              value={simForm.examMark}
              onChange={(e) => setSimForm({ ...simForm, examMark: e.target.value })}
              required
            />
          </div>
          {simError && <p className="text-red-500 text-xs">{simError}</p>}
          <button
            type="submit"
            disabled={simulating}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            {simulating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
            Simulate
          </button>
        </form>

        {simResult && (
          <div className={`mt-4 p-4 rounded-xl flex items-center gap-4 ${
            simResult.passed
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <GradeRing mark={simResult.finalMark} size={56} />
            <div>
              <p className="font-semibold text-gray-800 text-sm">
                Final mark: {simResult.finalMark?.toFixed(2)}/20
              </p>
              <p className={`text-sm mt-0.5 font-medium ${simResult.passed ? 'text-green-700' : 'text-red-700'}`}>
                {simResult.passed ? '✓ You would pass' : '✗ You would fail'}
              </p>
              {simResult.requiredExamToPass && (
                <p className="text-xs text-gray-600 mt-1">
                  Exam needed to pass: <span className={`font-semibold ${simResult.requiredExamToPass === 'IMPOSSIBLE' ? 'text-red-600' : 'text-gray-800'}`}>
                    {simResult.requiredExamToPass}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesPage;
