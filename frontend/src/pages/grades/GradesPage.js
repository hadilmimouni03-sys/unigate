import React, { useState, useEffect, useCallback } from 'react';
import { gradeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PASS = 10;

const markColor = (m) =>
  m == null ? 'text-slate-400'
  : m >= 14 ? 'text-green-600'
  : m >= PASS ? 'text-blue-600'
  : 'text-red-500';

const Spinner = () => (
  <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
  </div>
);

const StatusBadge = ({ passed, final: finalMark }) => {
  if (finalMark == null) return null;
  if (passed) {
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Pass</span>;
  }
  return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Fail</span>;
};

const ModuleCard = ({ grade, onSave, saving }) => {
  const isOfficial = grade.adminEntered;
  const hasTp = grade.tpWeight > 0;

  const [cc, setCc]     = useState(grade.ccMark   != null ? String(grade.ccMark)   : '');
  const [exam, setExam] = useState(grade.examMark != null ? String(grade.examMark) : '');
  const [tp, setTp]     = useState(grade.tpMark   != null ? String(grade.tpMark)   : '');

  // live preview (client-side)
  const ccVal   = parseFloat(cc)   || 0;
  const examVal = parseFloat(exam) || 0;
  const tpVal   = parseFloat(tp)   || 0;
  const hasAllRequired = cc !== '' && exam !== '' && (!hasTp || tp !== '');
  const preview = hasAllRequired
    ? Math.round((grade.ccWeight / 100 * ccVal + grade.examWeight / 100 * examVal + grade.tpWeight / 100 * tpVal) * 100) / 100
    : grade.finalMark;
  const previewPassed = preview != null && preview >= PASS;

  const reqExam = hasAllRequired && !previewPassed && grade.examWeight > 0
    ? Math.min(20, Math.max(0, (PASS - grade.ccWeight / 100 * ccVal) / (grade.examWeight / 100)))
    : null;

  const borderCls = preview == null
    ? 'border-slate-200'
    : previewPassed ? 'border-green-200' : 'border-red-200';

  const handleSubmit = () => {
    onSave({ moduleCode: grade.moduleCode, ccMark: parseFloat(cc), examMark: parseFloat(exam), tpMark: hasTp ? parseFloat(tp) : undefined });
  };

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${borderCls}`}>
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-50 bg-slate-50/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 text-sm truncate">{grade.moduleName}</h3>
            {isOfficial && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 shrink-0">
                Official
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {grade.department && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{grade.department}</span>
            )}
            <span className="text-xs text-slate-400">{grade.credits} credits · S{grade.semester}</span>
          </div>
        </div>
        <StatusBadge passed={previewPassed} final={preview} />
      </div>

      {/* Grade inputs */}
      <div className="px-5 py-4 space-y-3">
        {/* CC */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 w-10 shrink-0">CC</span>
          <input
            type="number" min="0" max="20" step="0.25"
            disabled={isOfficial}
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            placeholder="—"
            className="w-20 text-center text-sm border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-slate-400">/20</span>
          <span className="ml-auto text-xs text-slate-400 shrink-0">{grade.ccWeight}%</span>
        </div>

        {/* Exam */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 w-10 shrink-0">Exam</span>
          <input
            type="number" min="0" max="20" step="0.25"
            disabled={isOfficial}
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            placeholder="—"
            className="w-20 text-center text-sm border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-slate-400">/20</span>
          <span className="ml-auto text-xs text-slate-400 shrink-0">{grade.examWeight}%</span>
        </div>

        {/* TP (only if configured) */}
        {hasTp && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 w-10 shrink-0">TP</span>
            <input
              type="number" min="0" max="20" step="0.25"
              disabled={isOfficial}
              value={tp}
              onChange={(e) => setTp(e.target.value)}
              placeholder="—"
              className="w-20 text-center text-sm border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-slate-400">/20</span>
            <span className="ml-auto text-xs text-slate-400 shrink-0">{grade.tpWeight}%</span>
          </div>
        )}

        {/* Min exam needed */}
        {reqExam != null && !isOfficial && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Min exam to pass: <strong>{reqExam.toFixed(2)}/20</strong>
          </p>
        )}
        {grade.requiredExamToPass === 'IMPOSSIBLE' && !isOfficial && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Cannot pass with current CC mark
          </p>
        )}
      </div>

      {/* Result bar */}
      {preview != null && (
        <div className={`px-5 py-2.5 flex items-center justify-between border-t ${
          previewPassed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          <span className="text-sm font-bold text-slate-700">
            Final: <span className={markColor(preview)}>{preview.toFixed(2)}/20</span>
          </span>
          {!isOfficial && hasAllRequired && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-3 py-1 rounded-lg transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      )}
      {preview == null && !isOfficial && (
        <div className="px-5 py-2.5 border-t border-slate-100">
          <button
            onClick={handleSubmit}
            disabled={!hasAllRequired || saving}
            className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-1.5 rounded-lg transition"
          >
            {saving ? 'Saving…' : 'Save Grades'}
          </button>
        </div>
      )}
    </div>
  );
};

const STATUS_CFG = {
  PASS:       { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  label: 'You pass the year',               icon: '✓' },
  RATTRAPAGE: { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',  label: 'Rattrapage — retake failed exams', icon: '⚠' },
  FAIL:       { bg: 'bg-red-50 border-red-200',      text: 'text-red-700',    label: 'You fail the year',               icon: '✗' },
};

const GradesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [grades, setGrades]     = useState([]);
  const [semester, setSemester] = useState('all');
  const [loading, setLoading]   = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    gradeApi.myGrades()
      .then(({ data }) => setGrades(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = async (moduleCode, payload) => {
    setSavingId(moduleCode);
    try {
      const { data } = await gradeApi.enterMyGrade(payload);
      setGrades((prev) => prev.map((g) => g.moduleCode === moduleCode ? data : g));
      notify('Grades saved!');
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save grades.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const filtered = semester === 'all'
    ? grades
    : grades.filter((g) => g.semester === parseInt(semester));

  // Summary calculations
  const withFinal   = filtered.filter((g) => g.finalMark != null);
  const passing     = withFinal.filter((g) => g.passed);
  const failing     = withFinal.filter((g) => !g.passed);
  const totalCredits  = filtered.reduce((s, g) => s + g.credits, 0);
  const earnedCredits = passing.reduce((s, g) => s + g.credits, 0);
  const lostCredits   = failing.reduce((s, g) => s + g.credits, 0);
  const gpa = withFinal.length > 0
    ? Math.round(withFinal.reduce((s, g) => s + g.finalMark * g.credits, 0)
        / withFinal.reduce((s, g) => s + g.credits, 0) * 100) / 100
    : null;
  const status = gpa == null ? null : gpa < PASS ? 'FAIL' : lostCredits > 0 ? 'RATTRAPAGE' : 'PASS';
  const scfg = status ? STATUS_CFG[status] : null;

  // Semester options derived from loaded grades
  const semesters = [...new Set(grades.map((g) => g.semester))].sort();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Grades</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? 'Grade overview' : 'Enter your CC, Exam, and TP marks — the system calculates your final result'}
          </p>
        </div>

        {/* Semester pills */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setSemester('all')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${semester === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >All</button>
          {semesters.map((s) => (
            <button
              key={s}
              onClick={() => setSemester(String(s))}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${semester === String(s) ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >S{s}</button>
          ))}
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

      {/* Summary bar */}
      {gpa != null && scfg && (
        <div className={`rounded-2xl border-2 p-5 ${scfg.bg}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">GPA</p>
              <p className={`text-2xl font-bold ${markColor(gpa)}`}>
                {gpa.toFixed(2)}<span className="text-sm font-normal text-slate-400">/20</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Credits Earned</p>
              <p className="text-2xl font-bold text-slate-800">
                {earnedCredits}<span className="text-sm font-normal text-slate-400">/{totalCredits}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Credits Lost</p>
              <p className={`text-2xl font-bold ${lostCredits > 0 ? 'text-red-500' : 'text-slate-400'}`}>{lostCredits}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Year Result</p>
              <p className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${scfg.text}`}>
                <span>{scfg.icon}</span>{scfg.label}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Module cards */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">No modules configured yet</p>
          <p className="text-slate-400 text-sm mt-1">Your admin hasn't set up grade configurations for your department</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((g) => (
            <ModuleCard
              key={g.moduleCode}
              grade={g}
              saving={savingId === g.moduleCode}
              onSave={(payload) => handleSave(g.moduleCode, payload)}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      {!isAdmin && filtered.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-400 space-y-1">
          <p><strong className="text-slate-500">Official</strong> — Grade entered by your admin. Read-only.</p>
          <p><strong className="text-slate-500">CC</strong> — Continuous assessment · <strong className="text-slate-500">TP</strong> — Practical work (shown when applicable)</p>
          <p>Weights are set by your department admin and shown as % on each row.</p>
        </div>
      )}
    </div>
  );
};

export default GradesPage;
