import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div>
      <label htmlFor="language-select">Оберіть мову:</label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label="Select language"
      >
        <option value="en">English</option>
        <option value="uk">Українська</option>
      </select>
    </div>
  );
};