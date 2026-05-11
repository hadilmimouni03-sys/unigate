import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const REGISTRATION_TYPES = [
  { value: 'FIRST_YEAR_ING', label: '1st Year Engineering' },
  { value: 'SECOND_YEAR_ING', label: '2nd Year Engineering' },
  { value: 'THIRD_YEAR_ING', label: '3rd Year Engineering' },
  { value: 'MASTER_M1', label: 'Master M1' },
  { value: 'MASTER_M2', label: 'Master M2' },
  { value: 'DOUBLE_DIPLOMA', label: 'Double Diploma' },
  { value: 'EXCHANGE_PROGRAM', label: 'Exchange Program' },
];

const FALLBACK_DEPARTMENTS = ['Computer Science', 'Génie Industriel'];

const STEP_LABELS = ['Personal Info', 'Program', 'Confirm'];

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition text-slate-900 placeholder-slate-400";
const selectCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition text-slate-900";

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    registrationType: '', department: '', speciality: '',
    partnerUniversity: '', partnerCountry: '', targetSemester: '',
  });
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/public/departments')
      .then((res) => { if (res.data?.length) setDepartments(res.data); })
      .catch(() => {});
  }, []);

  const isSelectiveType = ['MASTER_M1', 'MASTER_M2', 'DOUBLE_DIPLOMA', 'EXCHANGE_PROGRAM'].includes(form.registrationType);
  const isExchangeOrDD  = ['DOUBLE_DIPLOMA', 'EXCHANGE_PROGRAM'].includes(form.registrationType);
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validateStep1 = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('All fields are required'); return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return false;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters'); return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.registrationType || !form.department) {
      setError('Please fill all required fields'); return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">UG</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">UniGate</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Student registration — takes about 2 minutes</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const active = step === s;
            const done   = step > s;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition ${
                    done   ? 'bg-emerald-500 text-white' :
                    active ? 'bg-primary-600 text-white shadow-md' :
                             'bg-slate-200 text-slate-400'
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : s}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? 'text-primary-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`h-0.5 w-16 mx-2 mb-5 rounded transition ${step > s ? 'bg-emerald-400' : 'bg-slate-200'}`}/>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 mb-6 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name">
                    <input type="text" required value={form.firstName}
                      onChange={(e) => set('firstName', e.target.value)}
                      className={inputCls} placeholder="Ahmed" />
                  </Field>
                  <Field label="Last Name">
                    <input type="text" required value={form.lastName}
                      onChange={(e) => set('lastName', e.target.value)}
                      className={inputCls} placeholder="Ben Ali" />
                  </Field>
                </div>
                <Field label="Email address">
                  <input type="email" required value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    className={inputCls} placeholder="ahmed@example.com" />
                </Field>
                <Field label="Password">
                  <input type="password" required value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    className={inputCls} placeholder="Min. 8 characters" />
                </Field>
                <Field label="Confirm Password">
                  <input type="password" required value={form.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    className={inputCls} placeholder="Repeat password" />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Field label="Program Type">
                  <select value={form.registrationType}
                    onChange={(e) => set('registrationType', e.target.value)}
                    className={selectCls}>
                    <option value="">Select a program…</option>
                    {REGISTRATION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>

                {form.registrationType && (
                  <>
                    <Field label="Department">
                      <select value={form.department}
                        onChange={(e) => set('department', e.target.value)}
                        className={selectCls}>
                        <option value="">Select a department…</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Field>

                    {isSelectiveType && (
                      <Field label="Speciality">
                        <input type="text" value={form.speciality}
                          onChange={(e) => set('speciality', e.target.value)}
                          className={inputCls} placeholder="e.g. Artificial Intelligence" />
                      </Field>
                    )}

                    {isExchangeOrDD && (
                      <>
                        <Field label="Partner University">
                          <input type="text" value={form.partnerUniversity}
                            onChange={(e) => set('partnerUniversity', e.target.value)}
                            className={inputCls} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Country">
                            <input type="text" value={form.partnerCountry}
                              onChange={(e) => set('partnerCountry', e.target.value)}
                              className={inputCls} />
                          </Field>
                          <Field label="Target Semester">
                            <input type="text" value={form.targetSemester} placeholder="e.g. S5"
                              onChange={(e) => set('targetSemester', e.target.value)}
                              className={inputCls} />
                          </Field>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Review your information</p>
                <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {[
                    { label: 'Name', value: `${form.firstName} ${form.lastName}` },
                    { label: 'Email', value: form.email },
                    { label: 'Program', value: REGISTRATION_TYPES.find((t) => t.value === form.registrationType)?.label },
                    { label: 'Department', value: form.department },
                  ].map(({ label, value }) => value && (
                    <div key={label} className="flex justify-between px-4 py-3">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-sm font-semibold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
                  </svg>
                  <p className="text-xs text-primary-700">
                    After registration, you will need to upload the required documents to complete your application.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
              {step > 1 ? (
                <button
                  type="button" onClick={() => { setStep(step - 1); setError(''); }}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                  </svg>
                  Back
                </button>
              ) : (
                <Link to="/" className="flex items-center gap-2 px-5 py-2.5 text-slate-500 hover:text-slate-700 font-medium text-sm transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                  </svg>
                  Sign in instead
                </Link>
              )}

              {step < 3 ? (
                <button
                  type="button" onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition shadow-sm"
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit" disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition shadow-sm"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
