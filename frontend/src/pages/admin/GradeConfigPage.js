import React, { useState, useEffect } from 'react';
import { gradeApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const uid = () => Math.random().toString(36).slice(2);

// ── Small shared components ───────────────────────────────────────────────

const Toggle = ({ on, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-200'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
  </button>
);

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const WeightMiniBar = ({ cc, exam, tp, hasTP }) => {
  const total = cc + exam + (hasTP ? tp : 0);
  if (total === 0) return <div className="h-1.5 w-full bg-slate-100 rounded-full" />;
  return (
    <div className="h-1.5 w-full flex rounded-full overflow-hidden">
      <div className="bg-blue-400 transition-all"    style={{ width: `${(cc / total) * 100}%` }} />
      <div className="bg-violet-400 transition-all"  style={{ width: `${(exam / total) * 100}%` }} />
      {hasTP && <div className="bg-emerald-400 transition-all" style={{ width: `${(tp / total) * 100}%` }} />}
    </div>
  );
};

const TableInput = ({ type = 'text', value, onChange, disabled, placeholder, min, max, step, width = 'w-24', mono = false }) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    min={min}
    max={max}
    step={step}
    className={`${width} border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm ${mono ? 'font-mono' : ''} bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition`}
  />
);

// ── Stats bar ─────────────────────────────────────────────────────────────
const StatsBar = ({ courses }) => {
  const valid     = courses.filter(c => Math.abs(c.ccWeight + c.examWeight + (c.hasTP ? c.tpWeight : 0) - 100) < 0.1 && c.moduleCode && c.moduleName);
  const totalCred = courses.reduce((a, c) => a + (c.credits || 0), 0);
  const byS1      = courses.filter(c => c.semester === 1).length;
  const byS2      = courses.filter(c => c.semester === 2).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Modules total',   value: courses.length, sub: `${valid.length} valide${valid.length !== 1 ? 's' : ''}`, ok: valid.length === courses.length && courses.length > 0 },
        { label: 'Crédits configurés', value: totalCred, sub: 'crédits au total', ok: totalCred > 0 },
        { label: 'Semestre 1',      value: byS1, sub: `module${byS1 !== 1 ? 's' : ''}`, ok: byS1 > 0 },
        { label: 'Semestre 2',      value: byS2, sub: `module${byS2 !== 1 ? 's' : ''}`, ok: byS2 > 0 },
      ].map(({ label, value, sub, ok }) => (
        <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold font-mono ${ok ? 'text-slate-800' : 'text-slate-400'}`}>{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
};

// ── GradeConfigPage ───────────────────────────────────────────────────────
const GradeConfigPage = () => {
  const { user } = useAuth();
  const [courses,   setCourses]   = useState([]);
  const [semester,  setSemester]  = useState('all');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [feedback,  setFeedback]  = useState(null);

  const dept = user?.department;

  useEffect(() => {
    setLoading(true);
    gradeApi
      .getConfig(dept || undefined, semester !== 'all' ? parseInt(semester) : undefined)
      .then(({ data }) => {
        setCourses(data.map(c => ({ ...c, hasTP: c.tpWeight > 0, _key: c.id || uid() })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dept, semester]);

  const update = (key, field, value) => {
    setCourses(prev => prev.map(c => c._key === key ? { ...c, [field]: value } : c));
    setSaved(false);
  };

  const addCourse = () => {
    setCourses(prev => [
      ...prev,
      {
        _key: uid(), id: null, moduleCode: '', moduleName: '',
        department: dept, ccWeight: 40, examWeight: 60, tpWeight: 0,
        hasTP: false, credits: 3,
        semester: semester !== 'all' ? parseInt(semester) : 1,
        parentModuleName: '',
      },
    ]);
    setSaved(false);
  };

  const removeCourse = (key) => {
    setCourses(prev => prev.filter(c => c._key !== key));
    setSaved(false);
  };

  const totalWeight = (c) => c.ccWeight + c.examWeight + (c.hasTP ? c.tpWeight : 0);

  const notify = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSave = async () => {
    const invalid = courses.some(c =>
      Math.abs(totalWeight(c) - 100) > 0.1 || !c.moduleCode || !c.moduleName,
    );
    if (invalid) {
      notify('Corrigez les erreurs avant de sauvegarder (poids = 100%, code et nom obligatoires).', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = courses.map(c => ({
        id:               c.id || undefined,
        moduleCode:       c.moduleCode,
        moduleName:       c.moduleName,
        department:       dept,
        ccWeight:         c.ccWeight,
        examWeight:       c.examWeight,
        tpWeight:         c.hasTP ? c.tpWeight : 0,
        credits:          c.credits,
        semester:         c.semester,
        parentModuleName: c.parentModuleName || null,
      }));
      const { data } = await gradeApi.saveConfig(payload);
      setCourses(data.map(c => ({ ...c, hasTP: c.tpWeight > 0, _key: c.id || uid() })));
      setSaved(true);
      notify('Configuration enregistrée avec succès !');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      notify('Erreur lors de la sauvegarde.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const visibleCourses = semester !== 'all'
    ? courses.filter(c => c.semester === parseInt(semester))
    : courses;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuration des notes</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {dept ? `Département : ${dept}` : 'Configurer les poids et crédits par module'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Semester filter */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {['all', '1', '2'].map(s => (
              <button
                key={s}
                onClick={() => setSemester(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${semester === s ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {s === 'all' ? 'Tous' : `S${s}`}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:bg-blue-300'
            }`}
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement…
              </>
            ) : saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                Enregistré
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
                </svg>
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
          feedback.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Stats */}
      {!loading && <StatsBar courses={courses} />}

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">Modules configurés</h2>
              {courses.length > 0 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                  {visibleCourses.length}
                </span>
              )}
            </div>
            <button
              onClick={addCourse}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Ajouter un module
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    'Code', 'Nom de la matière', 'Module parent', 'Crédits', 'Sem.',
                    'CC %', 'Exam %', 'TP', 'TP %', 'Total', 'Répartition', '',
                  ].map(h => (
                    <th key={h} className="text-left px-3 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleCourses.map(c => {
                  const tw  = totalWeight(c);
                  const ok  = Math.abs(tw - 100) < 0.1;
                  const hasCode = Boolean(c.moduleCode);
                  const hasName = Boolean(c.moduleName);
                  const rowValid = ok && hasCode && hasName;

                  return (
                    <tr
                      key={c._key}
                      className={`hover:bg-slate-50/50 transition ${!rowValid ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-3 py-3">
                        <TableInput
                          value={c.moduleCode}
                          onChange={v => update(c._key, 'moduleCode', v)}
                          placeholder="MATH101"
                          width="w-24"
                          mono
                        />
                        {!hasCode && <p className="text-xs text-red-500 mt-1">Requis</p>}
                      </td>
                      <td className="px-3 py-3">
                        <TableInput
                          value={c.moduleName}
                          onChange={v => update(c._key, 'moduleName', v)}
                          placeholder="Analyse"
                          width="w-36"
                        />
                        {!hasName && <p className="text-xs text-red-500 mt-1">Requis</p>}
                      </td>
                      <td className="px-3 py-3">
                        <TableInput
                          value={c.parentModuleName || ''}
                          onChange={v => update(c._key, 'parentModuleName', v)}
                          placeholder="Mathématiques"
                          width="w-32"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <TableInput
                          type="number" min={1} max={30}
                          value={c.credits}
                          onChange={v => update(c._key, 'credits', parseInt(v) || 1)}
                          width="w-14"
                          mono
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={c.semester}
                          onChange={e => update(c._key, 'semester', parseInt(e.target.value))}
                          className="w-14 border border-slate-200 rounded-lg px-1.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        >
                          <option value={1}>S1</option>
                          <option value={2}>S2</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <TableInput
                          type="number" min={0} max={100} step={5}
                          value={c.ccWeight}
                          onChange={v => update(c._key, 'ccWeight', v)}
                          width="w-16"
                          mono
                        />
                      </td>
                      <td className="px-3 py-3">
                        <TableInput
                          type="number" min={0} max={100} step={5}
                          value={c.examWeight}
                          onChange={v => update(c._key, 'examWeight', v)}
                          width="w-16"
                          mono
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Toggle on={c.hasTP} onToggle={() => update(c._key, 'hasTP', !c.hasTP)} />
                      </td>
                      <td className="px-3 py-3">
                        <TableInput
                          type="number" min={0} max={100} step={5}
                          value={c.tpWeight}
                          onChange={v => update(c._key, 'tpWeight', v)}
                          disabled={!c.hasTP}
                          width="w-16"
                          mono
                        />
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-sm font-bold font-mono ${ok ? 'text-green-600' : 'text-red-500'}`}>
                          {tw}%
                        </span>
                        {!ok && (
                          <p className="text-xs text-red-400 mt-0.5">{tw < 100 ? `−${100 - tw}%` : `+${tw - 100}%`}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 w-28">
                        <WeightMiniBar cc={c.ccWeight} exam={c.examWeight} tp={c.tpWeight} hasTP={c.hasTP} />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => removeCourse(c._key)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {visibleCourses.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path d="M12 4v16m8-8H4"/>
                        </svg>
                      </div>
                      <p className="text-slate-500 font-medium text-sm">Aucun module configuré</p>
                      <p className="text-slate-400 text-xs mt-1">Cliquez sur « Ajouter un module » pour commencer</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          {
            icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z',
            title: 'Poids (CC + Exam + TP)',
            desc: 'La somme des poids de chaque matière doit être exactement 100 %. La barre colorée en donne un aperçu visuel.',
          },
          {
            icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            title: 'Module parent',
            desc: 'Regroupez plusieurs matières sous un même module (ex. « Analyse » + « Algèbre » → « Mathématiques »). Laissez vide pour une matière autonome.',
          },
          {
            icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
            title: 'Coefficient',
            desc: 'Poids de la matière dans le calcul de la moyenne du module. Ex. coefficient 2 compte double par rapport au coefficient 1.',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3">
            <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d={icon}/>
            </svg>
            <div>
              <p className="text-xs font-semibold text-blue-800">{title}</p>
              <p className="text-xs text-blue-700 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GradeConfigPage;
