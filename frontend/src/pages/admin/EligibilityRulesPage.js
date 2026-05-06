import React, { useState, useEffect } from 'react';
import { eligibilityApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const uid = () => Math.random().toString(36).slice(2);

const YEARS = ['1st Year', '2nd Year', '3rd Year', 'M1', 'M2', 'Exchange Program', 'Double Diplôme'];

const DEFAULT_RULES = {
  '1st Year': [
    { id: '1', rule: 'Minimum GPA',           condition: 'GPA ≥',     value: '10',        enabled: true  },
    { id: '2', rule: 'Required Credits',       condition: 'Credits ≥', value: '30',        enabled: true  },
    { id: '3', rule: 'No Failed Core Courses', condition: 'Failed ≤',  value: '0',         enabled: false },
  ],
  '2nd Year': [
    { id: '1', rule: 'Minimum GPA',      condition: 'GPA ≥',     value: '10', enabled: true },
    { id: '2', rule: 'Required Credits', condition: 'Credits ≥', value: '60', enabled: true },
  ],
  '3rd Year': [
    { id: '1', rule: 'Minimum GPA',         condition: 'GPA ≥',     value: '12',        enabled: true },
    { id: '2', rule: 'Internship Completed', condition: 'Status =',  value: 'Completed', enabled: true },
    { id: '3', rule: 'Required Credits',     condition: 'Credits ≥', value: '90',        enabled: true },
  ],
  'M1': [
    { id: '1', rule: 'Minimum GPA',      condition: 'GPA ≥',     value: '12',  enabled: true },
    { id: '2', rule: 'Required Credits', condition: 'Credits ≥', value: '120', enabled: true },
  ],
  'M2': [
    { id: '1', rule: 'Minimum GPA',               condition: 'GPA ≥',    value: '12',        enabled: true },
    { id: '2', rule: 'Research Project Submitted', condition: 'Status =', value: 'Submitted', enabled: true },
  ],
  'Exchange Program': [
    { id: '1', rule: 'Minimum GPA',          condition: 'GPA ≥',    value: '13', enabled: true },
    { id: '2', rule: 'Language Certificate', condition: 'Level ≥',  value: 'B2', enabled: true },
  ],
  'Double Diplôme': [
    { id: '1', rule: 'Minimum GPA',                 condition: 'GPA ≥',    value: '14',       enabled: true },
    { id: '2', rule: 'Partner University Agreement', condition: 'Status =', value: 'Approved', enabled: true },
  ],
};

const Toggle = ({ on, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`relative w-9 h-5 rounded-full transition shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-200'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
  </button>
);

const EligibilityRulesPage = () => {
  const [activeYear, setActiveYear] = useState('1st Year');
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [saved, setSaved] = useState(false);

  const { user } = useAuth();
  const dept = user?.department;

  // Load rules from API when year or dept changes
  useEffect(() => {
    if (!dept) return;
    eligibilityApi.getRules(dept, activeYear).then(({ data }) => {
      if (data.length > 0) {
        setRules((prev) => ({
          ...prev,
          [activeYear]: data.map((r) => ({
            id: r.id ? String(r.id) : uid(),
            rule: r.ruleName,
            condition: r.conditionType,
            value: r.targetValue,
            enabled: r.enabled,
          })),
        }));
      }
    }).catch(() => {});
  }, [dept, activeYear]);

  const currentRules = rules[activeYear] || [];

  const updateRule = (id, field, value) => {
    setRules((prev) => ({
      ...prev,
      [activeYear]: prev[activeYear].map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
    setSaved(false);
  };

  const addRule = () => {
    setRules((prev) => ({
      ...prev,
      [activeYear]: [...prev[activeYear], { id: uid(), rule: 'New Rule', condition: 'Value ≥', value: '0', enabled: true }],
    }));
  };

  const removeRule = (id) => {
    setRules((prev) => ({ ...prev, [activeYear]: prev[activeYear].filter((r) => r.id !== id) }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!dept) return;
    const payload = currentRules.map((r) => ({
      ruleName: r.rule,
      conditionType: r.condition,
      targetValue: r.value,
      enabled: r.enabled,
    }));
    try {
      await eligibilityApi.saveRules(activeYear, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // keep existing saved-false state
    }
  };

  const enabledCount = currentRules.filter((r) => r.enabled).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Eligibility Rules</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure enrollment eligibility conditions per academic year</p>
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

      {/* Year tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {YEARS.map((year) => (
          <button
            key={year}
            onClick={() => setActiveYear(year)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              activeYear === year ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Mini stats */}
      <div className="flex gap-3">
        {[
          { label: 'Total Rules', value: currentRules.length,             color: 'text-slate-800' },
          { label: 'Active',      value: enabledCount,                    color: 'text-blue-600'  },
          { label: 'Disabled',    value: currentRules.length - enabledCount, color: 'text-slate-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
            <span className={`text-lg font-bold ${color}`}>{value}</span>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Rules table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Rules for {activeYear}</h2>
          <button
            onClick={addRule}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Add Rule
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Rule Name', 'Condition', 'Value', 'Enabled', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentRules.map((rule) => (
                <tr key={rule.id} className={`transition hover:bg-slate-50/50 ${!rule.enabled ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <input type="text" value={rule.rule} onChange={(e) => updateRule(rule.id, 'rule', e.target.value)}
                      className="w-48 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  </td>
                  <td className="px-5 py-3.5">
                    <input type="text" value={rule.condition} onChange={(e) => updateRule(rule.id, 'condition', e.target.value)}
                      className="w-32 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  </td>
                  <td className="px-5 py-3.5">
                    <input type="text" value={rule.value} onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                      className="w-24 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                  </td>
                  <td className="px-5 py-3.5">
                    <Toggle on={rule.enabled} onToggle={() => updateRule(rule.id, 'enabled', !rule.enabled)}/>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => removeRule(rule.id)} className="text-slate-300 hover:text-red-400 transition p-1 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {currentRules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                      </svg>
                    </div>
                    <p className="text-slate-500 font-medium">No rules for {activeYear}</p>
                    <p className="text-slate-400 text-xs mt-1">Click "Add Rule" to define eligibility conditions</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 px-4 py-3 flex gap-3">
        <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          Rules are evaluated when a student submits their registration application. Disabled rules are skipped during eligibility checks. Changes take effect after saving.
        </p>
      </div>
    </div>
  );
};

export default EligibilityRulesPage;
