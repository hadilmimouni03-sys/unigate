import React, { useState, useEffect } from 'react';

const PASS = 10;

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const newCourse = () => ({
  id: uid(),
  name: '',
  coef: 3,
  dsGrade: '',
  dsWeight: 40,
  examGrade: '',
  examWeight: 60,
  hasTP: false,
  tpGrade: '',
  tpWeight: 0,
});

const computeFinal = (c) => {
  const ds = parseFloat(c.dsGrade);
  const exam = parseFloat(c.examGrade);
  if (isNaN(ds) || isNaN(exam)) return null;
  if (c.hasTP && isNaN(parseFloat(c.tpGrade))) return null;
  const tp = c.hasTP ? parseFloat(c.tpGrade) : 0;
  const tpW = c.hasTP ? c.tpWeight / 100 : 0;
  const val = (c.dsWeight / 100) * ds + (c.examWeight / 100) * exam + tpW * tp;
  return Math.round(val * 100) / 100;
};

const weightSum = (c) =>
  c.dsWeight + c.examWeight + (c.hasTP ? c.tpWeight : 0);

const markColor = (m) =>
  m == null ? 'text-gray-400' : m >= 14 ? 'text-green-600' : m >= PASS ? 'text-blue-600' : 'text-red-500';

// ── Sub-components ──────────────────────────────────────────────────────────

const GradeInput = ({ label, grade, weight, onGrade, onWeight }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs font-semibold text-gray-500 w-9 shrink-0">{label}</span>
    <div className="flex items-center gap-1">
      <input
        type="number" min="0" max="20" step="0.25"
        value={grade}
        onChange={(e) => onGrade(e.target.value)}
        placeholder="—"
        className="w-16 text-center text-sm border border-gray-200 rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
      />
      <span className="text-xs text-gray-400">/20</span>
    </div>
    <div className="flex items-center gap-1 ml-2">
      <input
        type="number" min="0" max="100" step="5"
        value={weight}
        onChange={(e) => onWeight(e.target.value)}
        className="w-14 text-center text-sm border border-gray-200 rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
      />
      <span className="text-xs text-gray-400">%</span>
    </div>
  </div>
);

const Toggle = ({ on, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`relative w-8 h-4 rounded-full transition shrink-0 ${on ? 'bg-blue-500' : 'bg-gray-200'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`}
    />
  </button>
);

const CourseCard = ({ course, index, onUpdate, onRemove, canRemove }) => {
  const final = computeFinal(course);
  const wsum = weightSum(course);
  const weightsOk = Math.abs(wsum - 100) < 0.01;
  const passed = final !== null && final >= PASS;

  const borderCls = final === null
    ? 'border-gray-100'
    : passed ? 'border-green-200' : 'border-red-200';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${borderCls}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50">
        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
          {index + 1}
        </div>
        <input
          type="text"
          value={course.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Course name…"
          className="flex-1 text-sm font-medium text-gray-800 border-0 outline-none bg-transparent placeholder-gray-300"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-400">Coef.</span>
          <input
            type="number" min="1" max="20" step="1"
            value={course.coef}
            onChange={(e) => onUpdate('coef', Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 text-center text-sm font-semibold border border-gray-200 rounded-lg py-1 outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
          />
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Grade inputs */}
      <div className="px-5 py-4 space-y-3">
        <GradeInput
          label="DS"
          grade={course.dsGrade}
          weight={course.dsWeight}
          onGrade={(v) => onUpdate('dsGrade', v)}
          onWeight={(v) => onUpdate('dsWeight', parseFloat(v) || 0)}
        />
        <GradeInput
          label="Exam"
          grade={course.examGrade}
          weight={course.examWeight}
          onGrade={(v) => onUpdate('examGrade', v)}
          onWeight={(v) => onUpdate('examWeight', parseFloat(v) || 0)}
        />

        {/* TP toggle */}
        <div className="flex items-center gap-3">
          <Toggle on={course.hasTP} onToggle={() => onUpdate('hasTP', !course.hasTP)} />
          <span className="text-xs text-gray-500 select-none">Has TP</span>
          {course.hasTP && (
            <div className="flex-1">
              <GradeInput
                label="TP"
                grade={course.tpGrade}
                weight={course.tpWeight}
                onGrade={(v) => onUpdate('tpGrade', v)}
                onWeight={(v) => onUpdate('tpWeight', parseFloat(v) || 0)}
              />
            </div>
          )}
        </div>

        {/* Weights warning */}
        {!weightsOk && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Weights sum to {wsum}% — must equal 100%
          </p>
        )}
      </div>

      {/* Result footer */}
      {final !== null && weightsOk && (
        <div className={`px-5 py-2.5 flex items-center justify-between border-t ${passed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <span className="text-sm font-bold text-gray-700">
            Final:{' '}
            <span className={markColor(final)}>{final.toFixed(2)}/20</span>
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {passed ? '✓ Pass' : '✗ Fail'}
          </span>
        </div>
      )}
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'unigate_grade_sim';

const STATUS_CFG = {
  PASS:       { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: '🎉', label: 'You pass the year' },
  RATTRAPAGE: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: '⚠️', label: 'Rattrapage — retake failed exams' },
  FAIL:       { bg: 'bg-red-50 border-red-200',     text: 'text-red-700',   icon: '✗',  label: 'You fail the year' },
};

const GradesPage = () => {
  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [newCourse()];
    } catch {
      return [newCourse()];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const add = () => setCourses((p) => [...p, newCourse()]);
  const remove = (id) => setCourses((p) => p.filter((c) => c.id !== id));
  const update = (id, key, val) =>
    setCourses((p) => p.map((c) => (c.id === id ? { ...c, [key]: val } : c)));
  const clearAll = () => {
    if (window.confirm('Clear all courses and start over?')) setCourses([newCourse()]);
  };

  // ── Simulation ──────────────────────────────────────────────────────────────

  const results = courses.map((c) => ({ ...c, final: computeFinal(c) }));
  const filled = results.filter((r) => r.final !== null && Math.abs(weightSum(r) - 100) < 0.01);

  const totalCoef   = courses.reduce((s, c) => s + Number(c.coef), 0);
  const filledCoef  = filled.reduce((s, c) => s + Number(c.coef), 0);
  const earnedCoef  = filled.filter((c) => c.final >= PASS).reduce((s, c) => s + Number(c.coef), 0);
  const failedCoef  = filled.filter((c) => c.final < PASS).reduce((s, c) => s + Number(c.coef), 0);

  const gpa = filledCoef > 0
    ? Math.round((filled.reduce((s, c) => s + c.final * Number(c.coef), 0) / filledCoef) * 100) / 100
    : null;

  const status =
    gpa === null      ? null
    : gpa < PASS      ? 'FAIL'
    : failedCoef > 0  ? 'RATTRAPAGE'
    : 'PASS';

  const scfg = status ? STATUS_CFG[status] : null;

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grade Simulator</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Enter your expected grades and component weights to simulate your results
          </p>
        </div>
        <button
          onClick={clearAll}
          className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition"
        >
          Clear all
        </button>
      </div>

      {/* Summary banner */}
      {gpa !== null && (
        <div className={`rounded-2xl border p-5 mb-6 ${scfg.bg}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">GPA</p>
              <p className={`text-2xl font-bold ${markColor(gpa)}`}>
                {gpa.toFixed(2)}
                <span className="text-sm font-normal text-gray-400">/20</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Credits earned</p>
              <p className="text-2xl font-bold text-gray-800">
                {earnedCoef}
                <span className="text-sm font-normal text-gray-400">/{totalCoef}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Credits lost</p>
              <p className={`text-2xl font-bold ${failedCoef > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {failedCoef}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Year result</p>
              <p className={`text-sm font-bold flex items-center gap-1.5 mt-1 ${scfg.text}`}>
                <span>{scfg.icon}</span>
                {scfg.label}
              </p>
            </div>
          </div>

          {status === 'RATTRAPAGE' && (
            <p className="text-xs text-amber-700 mt-3 border-t border-amber-200 pt-3">
              Your GPA is ≥ 10, but you failed {filled.filter((c) => c.final < PASS).length} course(s)
              ({failedCoef} credits). You must retake the exams for those courses.
            </p>
          )}
          {status === 'FAIL' && (
            <p className="text-xs text-red-600 mt-3 border-t border-red-200 pt-3">
              Your GPA is below 10 — you must repeat the year.
            </p>
          )}
          {status === 'PASS' && (
            <p className="text-xs text-green-700 mt-3 border-t border-green-200 pt-3">
              GPA ≥ 10 and all {totalCoef} credits earned — you pass the year!
            </p>
          )}
        </div>
      )}

      {/* Course cards */}
      <div className="space-y-4 mb-5">
        {results.map((c, i) => (
          <CourseCard
            key={c.id}
            course={c}
            index={i}
            onUpdate={(key, val) => update(c.id, key, val)}
            onRemove={() => remove(c.id)}
            canRemove={courses.length > 1}
          />
        ))}
      </div>

      {/* Add course button */}
      <button
        onClick={add}
        className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add Course
      </button>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-400 space-y-1">
        <p><strong className="text-gray-500">DS</strong> — Continuous assessment (devoir surveillé)</p>
        <p><strong className="text-gray-500">TP</strong> — Practical work (travaux pratiques) — toggle per course if applicable</p>
        <p><strong className="text-gray-500">GPA ≥ 10 + all credits</strong> → Pass · <strong className="text-gray-500">GPA ≥ 10 + missing credits</strong> → Rattrapage · <strong className="text-gray-500">GPA &lt; 10</strong> → Fail</p>
        <p>Your simulation is saved automatically in your browser.</p>
      </div>
    </div>
  );
};

export default GradesPage;
