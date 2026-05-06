import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { LANGUAGES } from '../../i18n/translations';

const ROLES = [
  {
    key: 'STUDENT',
    label: 'Student',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M12 14l9-5-9-5-9 5 9 5z"/>
        <path d="M12 14l6.16-3.422A12.083 12.083 0 0119.44 17.5 11.94 11.94 0 0112 20a11.94 11.94 0 01-7.44-2.5 12.083 12.083 0 01.28-6.922L12 14z"/>
      </svg>
    ),
    demos: [
      { label: 'Ahmed — Approved',     email: 'ahmed.ben.ali@student.unigate.com', pwd: 'Student@1234' },
      { label: 'Sarra — Under Review', email: 'sarra.trabelsi@student.unigate.com', pwd: 'Student@1234' },
    ],
  },
  {
    key: 'ADMIN',
    label: 'Admin',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
    demos: [
      { label: 'Admin CS',  email: 'admin.cs@unigate.com', pwd: 'Admin@1234' },
      { label: 'Admin GI',  email: 'admin.gi@unigate.com', pwd: 'Admin@1234' },
    ],
  },
  {
    key: 'SUPER_ADMIN',
    label: 'Super Admin',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    demos: [
      { label: 'Super Admin', email: 'superadmin@unigate.com', pwd: 'Admin@1234' },
    ],
  },
];

const FEATURES = [
  { text: 'Streamlined registration and document submission' },
  { text: 'Real-time application status tracking' },
  { text: 'Peer learning and skill exchange network' },
  { text: 'Integrated internship marketplace' },
];

const LoginPage = () => {
  const [role, setRole] = useState('STUDENT');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemos, setShowDemos] = useState(false);
  const { login } = useAuth();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();

  const cfg = ROLES.find((r) => r.key === role);

  const handleRoleChange = (r) => {
    setRole(r);
    setError('');
    setForm({ email: '', password: '' });
    setShowDemos(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'STUDENT') navigate('/student');
      else navigate('/admin');
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[46%] bg-primary-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Geometric background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-800/30"/>
          <div className="absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-primary-700/20"/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-primary-700/20 rounded-full"/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-primary-600/15 rounded-full"/>
          {/* Dot grid */}
          <svg className="absolute bottom-10 right-10 opacity-10" width="120" height="120" viewBox="0 0 120 120">
            {Array.from({ length: 6 }, (_, r) =>
              Array.from({ length: 6 }, (_, c) => (
                <circle key={`${r}-${c}`} cx={c * 24 + 12} cy={r * 24 + 12} r="2" fill="white"/>
              ))
            )}
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-base">UG</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">UniGate</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Your university<br/>portal, simplified.
            </h1>
            <p className="text-primary-300 text-base leading-relaxed max-w-sm">
              Manage registrations, track your application, collaborate with peers — all in one place.
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3 my-10">
          {FEATURES.map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary-600/40 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-primary-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span className="text-primary-200 text-sm">{f.text}</span>
            </div>
          ))}
        </div>

        <p className="text-primary-500 text-xs relative z-10">© 2026 UniGate — Smart University Portal</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col bg-slate-50">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">UG</span>
            </div>
            <span className="font-bold text-slate-900">UniGate</span>
          </div>
          <div className="hidden lg:block"/>

          {/* Language switcher */}
          <div className="flex gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  lang === l.code
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-slate-500 hover:bg-slate-200 border border-transparent'
                }`}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 pb-12">
          <div className="w-full max-w-md">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('auth.welcomeBack')}</h2>
              <p className="text-slate-500 text-sm">Sign in to continue to UniGate</p>
            </div>

            {/* Role selector */}
            <div className="flex gap-2 mb-7 p-1 bg-slate-200/60 rounded-xl">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => handleRoleChange(r.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    role === r.key
                      ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className={role === r.key ? 'text-primary-600' : 'text-slate-400'}>{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-7">

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 mb-5 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <input
                      type="email" required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition text-slate-900 placeholder-slate-400"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition text-slate-900 placeholder-slate-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm mt-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      {t('auth.signingIn')}
                    </>
                  ) : (
                    <>
                      {t('auth.signIn')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {role === 'STUDENT' && (
                <p className="text-center text-xs text-slate-500 mt-4">
                  {t('auth.noAccount')}{' '}
                  <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
                    {t('auth.registerHere')}
                  </Link>
                </p>
              )}
            </div>

            {/* Demo accounts */}
            <div className="mt-5">
              <button
                onClick={() => setShowDemos(!showDemos)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-600 transition px-1 mb-2"
              >
                <span>{t('auth.demoAccounts')}</span>
                <svg className={`w-3.5 h-3.5 transition-transform ${showDemos ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {showDemos && (
                <div className="space-y-2">
                  {cfg.demos.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => setForm({ email: acc.email, password: acc.pwd })}
                      className="w-full flex items-center justify-between bg-white hover:bg-primary-50 border border-slate-200 hover:border-primary-200 rounded-xl px-4 py-2.5 transition"
                    >
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-700">{acc.label}</p>
                        <p className="text-xs text-slate-400">{acc.email}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
