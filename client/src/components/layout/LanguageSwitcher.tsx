import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api.ts';
import { useAuthStore } from '../../store/authStore';
import { applyLocale } from '../../i18n/applyLocale';

interface Language {
  code: string;
  name: string;
  flag: string;
  isActive: boolean;
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const langs = await api.getLanguages();
        setLanguages(langs.filter(lang => lang.isActive));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load languages:', error);
        setLanguages([
          { code: 'uk', name: 'Українська', flag: '🇺🇦', isActive: true },
          { code: 'en', name: 'English', flag: '🇬🇧', isActive: true },
        ]);
        setLoading(false);
      }
    };
    loadLanguages();
  }, []);

  useEffect(() => {
    if (!loading && languages.length > 0) {
      const currentLang = languages.find(lang => lang.code === i18n.language);
      if (!currentLang) {
        i18n.changeLanguage('uk');
      }
    }
  }, [i18n, languages, loading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const changeLanguage = async (lng: string) => {
    setIsOpen(false);
    try {
      await applyLocale(lng);

      if (user?.id) {
        const updated = await api.updatePreferredLocale(lng);
        updateUser(updated);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  if (loading || languages.length === 0) {
    return null;
  }

  const currentLanguage = i18n.language;
  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-lg border bg-cyber-panel border-cyber-border text-gray-300 hover:border-cyber-primary hover:text-cyber-primary transition-all text-sm flex items-center gap-2"
      >
        <span>{currentLang.flag}</span>
        <span>{currentLang.code.toUpperCase()}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-cyber-panel border border-cyber-border rounded-lg shadow-lg z-50 min-w-[140px]">
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-3 py-2 text-sm transition-all flex items-center gap-2 ${
                currentLanguage === lang.code
                  ? 'bg-cyber-primary text-cyber-background'
                  : 'text-gray-300 hover:bg-cyber-border hover:text-cyber-primary'
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === languages.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

