import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { gradeApi } from '../../services/api';

const PASS = 10;
const r2 = (v) => Math.round(v * 100) / 100;

// ── Calculation helpers (mirror backend logic) ────────────────────────────
const calcAvg = (cfg, cc, exam, tp) => {
  const c = parseFloat(cc), e = parseFloat(exam);
  if (isNaN(c) || isNaN(e)) return null;
  const t = cfg.tpWeight > 0 && tp !== '' && !isNaN(parseFloat(tp)) ? parseFloat(tp) : 0;
  return r2((cfg.ccWeight / 100) * c + (cfg.examWeight / 100) * e + (cfg.tpWeight / 100) * t);
};

const calcReqExam = (cfg, cc, tp) => {
  const c = parseFloat(cc);
  if (isNaN(c)) return null;
  const t = cfg.tpWeight > 0 && tp !== '' && !isNaN(parseFloat(tp)) ? parseFloat(tp) : 0;
  const tpPart = (cfg.tpWeight / 100) * t;
  const req = (PASS - (cfg.ccWeight / 100) * c - tpPart) / (cfg.examWeight / 100);
  if (req > 20) return 'IMPOSSIBLE';
  if (req <= 0) return 'ALREADY';
  return r2(req).toFixed(2);
};

const calcModuleAvg = (subs) => {
  if (subs.some(s => s.avg === null)) return null;
  const total = subs.reduce((a, s) => a + s.w, 0);
  return total ? r2(subs.reduce((a, s) => a + s.avg * s.w, 0) / total) : null;
};

// ── Build semester → module → subject hierarchy ───────────────────────────
function buildHierarchy(configs, gradesMap, localMarks) {
  const bySem = {};
  for (const cfg of configs) {
    const sem = cfg.semester;
    if (!bySem[sem]) bySem[sem] = {};
    const mod = cfg.parentModuleName?.trim() || cfg.moduleName;
    if (!bySem[sem][mod]) bySem[sem][mod] = [];
    bySem[sem][mod].push(cfg);
  }

  return Object.keys(bySem)
    .sort((a, b) => +a - +b)
    .map(sem => {
      const modules = Object.entries(bySem[sem]).map(([modName, cfgs]) => {
        const subjects = cfgs.map(cfg => {
          const grade = gradesMap[cfg.moduleCode];
          const lm   = localMarks[cfg.moduleCode] || {};
          const cc   = lm.cc   !== undefined ? lm.cc   : (grade?.ccMark   != null ? String(grade.ccMark)   : '');
          const exam = lm.exam !== undefined ? lm.exam : (grade?.examMark != null ? String(grade.examMark) : '');
          const tp   = lm.tp   !== undefined ? lm.tp   : (grade?.tpMark   != null ? String(grade.tpMark)   : '');
          return {
            cfg, grade, cc, exam, tp,
            avg:     calcAvg(cfg, cc, exam, tp),
            reqExam: calcReqExam(cfg, cc, tp),
            w:       cfg.credits,
          };
        });

        const modAvg = calcModuleAvg(subjects.map(s => ({ avg: s.avg, w: s.w })));
        const credits = cfgs.reduce((a, c) => a + c.credits, 0);
        return { modName, subjects, avg: modAvg, credits, passed: modAvg !== null && modAvg >= PASS };
      });

      const withAvg = modules.filter(m => m.avg !== null);
      const semAvg  = withAvg.length
        ? r2(withAvg.reduce((a, m) => a + m.avg * m.credits, 0) / withAvg.reduce((a, m) => a + m.credits, 0))
        : null;
      const earned = modules.filter(m => m.passed).reduce((a, m) => a + m.credits, 0);
      const total  = modules.reduce((a, m) => a + m.credits, 0);
      return { sem: +sem, modules, semAvg, earned, total };
    });
}

// ── WeightBar ─────────────────────────────────────────────────────────────
const WeightBar = ({ cfg }) => (
  <div className="space-y-1.5">
    <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
      {cfg.ccWeight > 0 && (
        <div className="bg-blue-400 transition-all" style={{ width: `${cfg.ccWeight}%` }} />
      )}
      {cfg.examWeight > 0 && (
        <div className="bg-violet-400 transition-all" style={{ width: `${cfg.examWeight}%` }} />
      )}
      {cfg.tpWeight > 0 && (
        <div className="bg-emerald-400" style={{ width: `${cfg.tpWeight}%` }} />
      )}
    </div>
    <div className="flex items-center gap-3">
      <Dot color="bg-blue-400" label={`CC ${cfg.ccWeight}%`} />
      <Dot color="bg-violet-400" label={`Exam ${cfg.examWeight}%`} />
      {cfg.tpWeight > 0 && <Dot color="bg-emerald-400" label={`TP ${cfg.tpWeight}%`} />}
    </div>
  </div>
);

const Dot = ({ color, label }) => (
  <div className="flex items-center gap-1">
    <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
    <span className="text-xs text-slate-400">{label}</span>
  </div>
);

// ── AvgBadge ──────────────────────────────────────────────────────────────
const AvgBadge = ({ avg, size = 'sm' }) => {
  if (avg === null)
    return <span className={`font-mono text-slate-400 ${size === 'lg' ? 'text-base' : 'text-sm'}`}>—/20</span>;

  const pass = avg >= PASS;
  const sizeClasses = size === 'lg' ? 'text-base font-bold px-3 py-1' : 'text-xs font-semibold px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg font-mono transition-colors duration-300 ${sizeClasses} ${
      pass
        ? 'bg-green-100 text-green-700 border border-green-200'
        : 'bg-red-100 text-red-700 border border-red-200'
    }`}>
      {avg.toFixed(2)}/20
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        {pass ? <path d="M5 13l4 4L19 7"/> : <path d="M6 18L18 6M6 6l12 12"/>}
      </svg>
    </span>
  );
};

// ── MarkInput ─────────────────────────────────────────────────────────────
const MarkInput = ({ label, value, onChange, disabled, accent }) => {
  const ringClasses = {
    blue:    'focus:ring-blue-400 focus:border-blue-300',
    violet:  'focus:ring-violet-400 focus:border-violet-300',
    emerald: 'focus:ring-emerald-400 focus:border-emerald-300',
  }[accent] || 'focus:ring-blue-400';

  const labelClasses = {
    blue:    'text-blue-600',
    violet:  'text-violet-600',
    emerald: 'text-emerald-600',
  }[accent] || 'text-blue-600';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold w-9 shrink-0 ${labelClasses}`}>{label}</span>
      <input
        type="number"
        min="0"
        max="20"
        step="0.25"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder="—"
        className={`w-20 text-center text-sm font-mono border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-2 bg-white disabled:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition ${ringClasses}`}
      />
      <span className="text-xs text-slate-400">/20</span>
    </div>
  );
};

// ── StatusHint ────────────────────────────────────────────────────────────
const StatusHint = ({ reqExam, avg, hasTp }) => {
  const passed = avg !== null && avg >= PASS;

  if (reqExam === 'IMPOSSIBLE')
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Impossible — note CC{hasTp ? '/TP' : ''} trop basse pour valider
      </div>
    );

  if (reqExam === 'ALREADY')
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7"/>
        </svg>
        Validé par CC{hasTp ? '/TP' : ''} seul — l'examen est un bonus
      </div>
    );

  if (reqExam && !passed)
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        Note min. à l'examen :{' '}
        <strong className="font-mono ml-0.5">{reqExam}/20</strong>
      </div>
    );

  if (passed && reqExam !== 'ALREADY')
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7"/>
        </svg>
        Module validé
      </div>
    );

  return null;
};

// ── SubjectCard ───────────────────────────────────────────────────────────
const SubjectCard = ({ sub, onMarkChange, onSave, saving }) => {
  const { cfg, grade, cc, exam, tp, avg, reqExam } = sub;
  const isOfficial = Boolean(grade?.adminEntered);
  const hasTp      = cfg.tpWeight > 0;
  const passed     = avg !== null && avg >= PASS;
  const allFilled  = cc !== '' && exam !== '' && (!hasTp || tp !== '');

  const borderColor = avg === null ? 'border-slate-200'
    : passed ? 'border-green-300' : 'border-red-300';
  const accentBar = avg === null
    ? 'bg-slate-300'
    : passed
      ? 'bg-gradient-to-b from-green-400 to-green-500'
      : 'bg-gradient-to-b from-red-400 to-red-500';

  return (
    <div className={`flex rounded-xl border bg-white shadow-sm overflow-hidden transition-colors duration-300 ${borderColor}`}>
      {/* Vertical accent strip */}
      <div className={`w-1.5 shrink-0 transition-all duration-300 ${accentBar}`} />

      <div className="flex-1 p-4 space-y-3 min-w-0">
        {/* Subject header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-800 text-sm truncate">{cfg.moduleName}</span>
              {isOfficial && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold shrink-0">
                  Officiel
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono">{cfg.moduleCode} · {cfg.credits} crédit{cfg.credits > 1 ? 's' : ''}</span>
          </div>
          <div className="shrink-0">
            <AvgBadge avg={avg} />
          </div>
        </div>

        {/* Weight visualization */}
        <WeightBar cfg={cfg} />

        {/* Mark inputs */}
        <div className="space-y-2">
          <MarkInput label="CC"   value={cc}   onChange={v => onMarkChange(cfg.moduleCode, 'cc', v)}   disabled={isOfficial} accent="blue" />
          <MarkInput label="Exam" value={exam} onChange={v => onMarkChange(cfg.moduleCode, 'exam', v)} disabled={isOfficial} accent="violet" />
          {hasTp && (
            <MarkInput label="TP" value={tp} onChange={v => onMarkChange(cfg.moduleCode, 'tp', v)} disabled={isOfficial} accent="emerald" />
          )}
        </div>

        {/* Status message */}
        <StatusHint reqExam={reqExam} avg={avg} hasTp={hasTp} />

        {/* Footer */}
        {!isOfficial ? (
          <button
            onClick={() =>
              onSave(cfg.moduleCode, {
                moduleCode: cfg.moduleCode,
                ccMark:     parseFloat(cc),
                examMark:   parseFloat(exam),
                tpMark:     hasTp ? parseFloat(tp) : undefined,
              })
            }
            disabled={!allFilled || saving}
            className="w-full text-xs font-semibold py-2 rounded-lg transition-all bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        ) : (
          <p className="text-right text-xs text-blue-500">Lecture seule</p>
        )}
      </div>
    </div>
  );
};

// ── SummaryBar ────────────────────────────────────────────────────────────
const SummaryBar = ({ hierarchy }) => {
  const allMods  = hierarchy.flatMap(h => h.modules);
  const earned   = allMods.filter(m => m.passed).reduce((a, m) => a + m.credits, 0);
  const total    = allMods.reduce((a, m) => a + m.credits, 0);
  const lost     = allMods.filter(m => !m.passed && m.avg !== null).reduce((a, m) => a + m.credits, 0);
  const validated = allMods.filter(m => m.passed).length;
  const withAvg   = allMods.filter(m => m.avg !== null);
  const gpa       = withAvg.length
    ? r2(withAvg.reduce((a, m) => a + m.avg * m.credits, 0) / withAvg.reduce((a, m) => a + m.credits, 0))
    : null;

  const yearStatus = gpa === null ? null
    : gpa >= PASS && lost === 0 ? 'PASS'
    : gpa >= PASS               ? 'RATTRAPAGE'
    :                             'FAIL';

  const STATUS = {
    PASS:       { grad: 'from-green-50 to-emerald-50 border-green-200', badge: 'bg-green-600 text-white',  label: 'Admis' },
    RATTRAPAGE: { grad: 'from-amber-50 to-yellow-50 border-amber-200',  badge: 'bg-amber-500 text-white',  label: 'Rattrapage' },
    FAIL:       { grad: 'from-red-50 to-rose-50 border-red-200',        badge: 'bg-red-600 text-white',    label: 'Ajourné' },
  };

  const gpaColor = gpa === null ? 'text-slate-300'
    : gpa >= 14   ? 'text-green-600'
    : gpa >= PASS ? 'text-blue-600'
    :               'text-red-600';

  const cardBg = yearStatus
    ? `bg-gradient-to-br ${STATUS[yearStatus].grad}`
    : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200';

  return (
    <div className={`rounded-2xl border-2 p-5 ${cardBg} transition-colors duration-500`}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Moyenne générale</p>
          <p className={`text-3xl font-bold font-mono leading-none ${gpaColor}`}>
            {gpa !== null ? gpa.toFixed(2) : '—'}
            <span className="text-base font-normal text-slate-400">/20</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Crédits validés</p>
          <p className="text-3xl font-bold font-mono leading-none text-slate-800">
            {earned}
            <span className="text-base font-normal text-slate-400">/{total}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Modules validés</p>
          <p className="text-3xl font-bold font-mono leading-none text-slate-800">
            {validated}
            <span className="text-base font-normal text-slate-400">/{allMods.length}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Résultat annuel</p>
          {yearStatus ? (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold ${STATUS[yearStatus].badge}`}>
              {STATUS[yearStatus].label}
            </span>
          ) : (
            <p className="text-slate-400 text-sm mt-1">En attente</p>
          )}
        </div>
      </div>
      {lost > 0 && (
        <p className="mt-3 pt-3 border-t border-black/5 text-xs text-slate-500">
          <span className="text-red-600 font-semibold">{lost} crédit{lost > 1 ? 's' : ''}</span>{' '}
          perdu{lost > 1 ? 's' : ''} — module{lost > 1 ? 's' : ''} non validé{lost > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────
const GradesPage = () => {
  const [configs,    setConfigs]    = useState([]);
  const [gradesMap,  setGradesMap]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [localMarks, setLocalMarks] = useState({});
  const [savingCode, setSavingCode] = useState(null);
  const [feedback,   setFeedback]   = useState(null);
  const [semester,   setSemester]   = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cfgs }, { data: gds }] = await Promise.all([
        gradeApi.mySubjects(),
        gradeApi.myGrades(),
      ]);
      setConfigs(cfgs);
      const map = {};
      for (const g of gds) map[g.moduleCode] = g;
      setGradesMap(map);
    } catch {
      // silent — empty state shown below
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleMarkChange = (code, field, value) => {
    setLocalMarks(prev => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  };

  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async (moduleCode, payload) => {
    setSavingCode(moduleCode);
    try {
      const { data } = await gradeApi.enterMyGrade(payload);
      setGradesMap(prev => ({ ...prev, [moduleCode]: data }));
      setLocalMarks(prev => { const n = { ...prev }; delete n[moduleCode]; return n; });
      notify('Notes enregistrées avec succès');
    } catch (err) {
      notify(err.response?.data?.message || 'Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSavingCode(null);
    }
  };

  const semesters = useMemo(
    () => [...new Set(configs.map(c => c.semester))].sort(),
    [configs],
  );

  const filteredConfigs = useMemo(
    () => (semester !== 'all' ? configs.filter(c => c.semester === +semester) : configs),
    [configs, semester],
  );

  const hierarchy    = useMemo(() => buildHierarchy(filteredConfigs, gradesMap, localMarks), [filteredConfigs, gradesMap, localMarks]);
  const allHierarchy = useMemo(() => buildHierarchy(configs, gradesMap, localMarks),         [configs, gradesMap, localMarks]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes Notes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Saisie et consultation · calcul automatique en temps réel
          </p>
        </div>
        {semesters.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 self-start shrink-0">
            <button
              onClick={() => setSemester('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${semester === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Tous
            </button>
            {semesters.map(s => (
              <button
                key={s}
                onClick={() => setSemester(String(s))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${semester === String(s) ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                S{s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition ${
          feedback.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Summary dashboard */}
      {!loading && configs.length > 0 && <SummaryBar hierarchy={allHierarchy} />}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hierarchy.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-slate-700 font-semibold">Aucun module configuré</p>
          <p className="text-slate-400 text-sm mt-1">
            Votre administrateur n'a pas encore configuré les modules pour votre département.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {hierarchy.map(({ sem, modules, semAvg, earned, total }) => (
            <section key={sem}>
              {/* Semester header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-800">Semestre {sem}</h2>
                  <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-full">
                    {earned}/{total} crédits
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Moy. semestre :</span>
                  <AvgBadge avg={semAvg} size="lg" />
                </div>
              </div>

              {/* Module groups */}
              <div className="space-y-4">
                {modules.map(({ modName, subjects, avg: modAvg, credits: modCred, passed: modPassed }) => (
                  <div key={modName} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                    {/* Module header */}
                    <div className={`flex items-center justify-between px-5 py-3.5 border-b transition-colors duration-300 ${
                      modAvg === null
                        ? 'border-slate-200 bg-white'
                        : modPassed
                          ? 'border-green-100 bg-green-50'
                          : 'border-red-100 bg-red-50'
                    }`}>
                      <div>
                        <h3 className="font-bold text-slate-900">{modName}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {modCred} crédit{modCred > 1 ? 's' : ''} · {subjects.length} matière{subjects.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500">Module :</span>
                        <AvgBadge avg={modAvg} size="lg" />
                      </div>
                    </div>

                    {/* Subject cards */}
                    <div className={`p-4 ${subjects.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
                      {subjects.map(sub => (
                        <SubjectCard
                          key={sub.cfg.moduleCode}
                          sub={sub}
                          onMarkChange={handleMarkChange}
                          onSave={handleSave}
                          saving={savingCode === sub.cfg.moduleCode}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Legend */}
      {!loading && hierarchy.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-slate-100 text-xs text-slate-400">
          <Dot color="bg-blue-400"    label="CC" />
          <Dot color="bg-violet-400"  label="Examen" />
          <Dot color="bg-emerald-400" label="TP" />
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-300" />
            <span>Validé ≥ 10/20</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-300" />
            <span>Non validé</span>
          </div>
          <span className="ml-auto text-slate-300 hidden sm:block">
            Les poids sont configurés par votre département
          </span>
        </div>
      )}
    </div>
  );
};

export default GradesPage;
