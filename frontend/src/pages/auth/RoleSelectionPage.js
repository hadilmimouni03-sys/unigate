import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import { LANGUAGES } from '../../i18n/translations';

const ROLES = [
  {
    key: 'STUDENT',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path d="M12 14l9-5-9-5-9 5 9 5z"/>
      </svg>
    ),
    gradient: 'from-violet-500 to-purple-600',
    border: 'border-violet-200 hover:border-violet-400',
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-100 text-violet-700',
    tKey: 'auth.student',
    descKey: 'auth.studentDesc',
    loginPath: '/login?role=STUDENT',
  },
  {
    key: 'ADMIN',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-200 hover:border-blue-400',
    bg: 'bg-blue-50',
    iconBg: 'bg-blue-100 text-blue-700',
    tKey: 'auth.admin',
    descKey: 'auth.adminDesc',
    loginPath: '/login?role=ADMIN',
  },
  {
    key: 'SUPER_ADMIN',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    gradient: 'from-teal-500 to-cyan-600',
    border: 'border-teal-200 hover:border-teal-400',
    bg: 'bg-teal-50',
    iconBg: 'bg-teal-100 text-teal-700',
    tKey: 'auth.superAdmin',
    descKey: 'auth.superAdminDesc',
    loginPath: '/login?role=SUPER_ADMIN',
  },
];

const LanguageSwitcher = () => {
  const { lang, setLang, LANGUAGES } = useLang();
  return (
    <div className="flex gap-1.5">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
            lang === l.code
              ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
              : 'text-white/70 hover:text-white'
          }`}
        >
          {l.flag} {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl"/>
      </div>

      {/* Language switcher */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center relative z-10">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="text-white font-bold text-2xl">UG</span>
        </div>
        <h1 className="text-3xl font-bold text-white">UniGate</h1>
        <p className="text-white/60 text-sm mt-1">Smart University Registration Portal</p>
      </div>

      {/* Title */}
      <div className="text-center mb-8 relative z-10">
        <h2 className="text-xl font-semibold text-white">{t('auth.chooseRole')}</h2>
        <p className="text-white/60 text-sm mt-1">{t('auth.chooseRoleDesc')}</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl relative z-10">
        {ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => navigate(role.loginPath)}
            onMouseEnter={() => setHovered(role.key)}
            onMouseLeave={() => setHovered(null)}
            className={`group relative bg-white/10 backdrop-blur-sm border ${role.border} rounded-2xl p-6 text-left transition-all duration-300 hover:bg-white/20 hover:shadow-2xl hover:-translate-y-1 border-white/20`}
          >
            {/* Icon */}
            <div className={`w-14 h-14 ${role.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {role.icon}
            </div>

            <h3 className="text-white font-bold text-lg mb-1">{t(role.tKey)}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{t(role.descKey)}</p>

            {/* Arrow */}
            <div className="mt-4 flex items-center text-white/60 text-xs font-medium group-hover:text-white transition-colors">
              {t('auth.signIn')}
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>

            {/* Gradient bottom border */}
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${role.gradient} rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity`}/>
          </button>
        ))}
      </div>

      <p className="text-white/40 text-xs mt-10 relative z-10">
        © 2026 UniGate — Smart University Portal
      </p>
    </div>
  );
};

export default RoleSelectionPage;
