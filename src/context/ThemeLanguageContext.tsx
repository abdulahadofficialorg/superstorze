import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, TranslationKey, Language } from '../locales/translations';

export type Theme = 'dark' | 'light';

interface ThemeLanguageContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('app_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark'; // Default night/dark mode for gaming store
  });

  // Language state
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'en' || saved === 'bn') return saved;
    } catch {
      // ignore
    }
    return 'bn'; // Default Bangla
  });

  // Synchronize theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('app_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Synchronize language attribute
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    try {
      localStorage.setItem('app_language', language);
    } catch {
      // ignore
    }
  }, [language]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || (entry ? entry.bn : key);
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        setTheme,
        toggleLanguage,
        setLanguage,
        t,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = (): ThemeLanguageContextType => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
};

export const useTheme = () => {
  const { theme, toggleTheme, setTheme } = useThemeLanguage();
  return { theme, toggleTheme, setTheme, isDark: theme === 'dark', isLight: theme === 'light' };
};

export const useLanguage = () => {
  const { language, toggleLanguage, setLanguage, t } = useThemeLanguage();
  return { language, toggleLanguage, setLanguage, isBangla: language === 'bn', isEnglish: language === 'en', t };
};
