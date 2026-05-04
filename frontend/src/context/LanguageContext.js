import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr');

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = currentLang.dir;
  }, [lang, currentLang.dir]);

  const t = (path) => {
    const keys = path.split('.');
    let val = translations[lang];
    for (const key of keys) {
      val = val?.[key];
    }
    return val || path;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, currentLang, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
