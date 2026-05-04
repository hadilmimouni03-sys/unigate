import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { LANGUAGES } from '../../i18n/translations';

const ROLE_CONFIG = {
  STUDENT: {
    label: 'Étudiant',
    gradient: 'from-violet-500 to-purple-600',
    ring: 'focus:ring-violet-400',
    btn: 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800',
    icon: '🎓',
    demos: [
      { label: 'Ahmed (Approuvé)', email: 'ahmed.ben.ali@student.unigate.com', pwd: 'Student@1234' },
      { label: 'Sarra (En examen)', email: 'sarra.trabelsi@student.unigate.com', pwd: 'Student@1234' },
    ],
  },
  ADMIN: {
    label: 'Administrateur',
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'focus:ring-blue-400',
    btn: 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800',
    icon: '🛡️',
    demos: [
      { label: 'Admin Département', email: 'admin@unigate.com', pwd: 'Admin@1234' },
    ],
  },
  SUPER_ADMIN: {
    label: 'Super Administrateur',
    gradient: 'from-teal-500 to-cyan-600',
    ring: 'focus:ring-teal-400',
    btn: 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800',
    icon: '⚙️',
    demos: [
      { label: 'Super Admin', email: 'superadmin@unigate.com', pwd: 'Admin@1234' },
    ],
  },
};

const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="flex gap-1.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 rounded-lg text-xs font-semibold transition border ${
            lang === l.code
              ? 'border-purple-300 bg-purple-50 text-purple-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {l.flag} {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'STUDENT';
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.STUDENT;

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
      {/* Language switcher */}
      <div className="absolute top-5 right-5">
        <LanguageSwitcher />
      </div>

      {/* Back link */}
      <div className="absolute top-5 left-5">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {t('auth.back')}
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo + role badge */}
        <div className="text-center mb-8">
          <div className={`w-14 h-14 bg-gradient-to-br ${cfg.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            <span className="text-2xl">{cfg.icon}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UniGate</h1>
          <p className="text-sm text-gray-500 mt-1">{cfg.label}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h2 className="text-base font-semibold text-gray-800 mb-5">{t('auth.welcomeBack')}</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 mb-4 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.email')}</label>
              <input
                type="email" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 ${cfg.ring} focus:border-transparent transition`}
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.password')}</label>
              <input
                type="password" required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 ${cfg.ring} focus:border-transparent transition`}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full ${cfg.btn} disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm mt-1`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  {t('auth.signingIn')}
                </span>
              ) : t('auth.signIn')}
            </button>
          </form>

          {role === 'STUDENT' && (
            <p className="text-center text-xs text-gray-500 mt-4">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-violet-600 font-semibold hover:underline">
                {t('auth.registerHere')}
              </Link>
            </p>
          )}
        </div>

        {/* Demo accounts */}
        <div className="mt-5">
          <p className="text-xs text-gray-400 text-center mb-2.5">{t('auth.demoAccounts')}</p>
          <div className="space-y-2">
            {cfg.demos.map((acc) => (
              <button
                key={acc.email}
                onClick={() => setForm({ email: acc.email, password: acc.pwd })}
                className="w-full flex items-center justify-between bg-white hover:bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 transition shadow-sm"
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-700">{acc.label}</p>
                  <p className="text-xs text-gray-400">{acc.email}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
