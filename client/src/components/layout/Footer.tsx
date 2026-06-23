import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t, i18n } = useTranslation(['ui', 'agreement']);
  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 min-h-11 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-cyber-border bg-cyber-panel px-4">
      <span className="text-xs text-gray-500 text-center">
        {t('footerCopyright', {
          ns: 'ui',
          year,
          defaultValue: isEn
            ? `© ${year} CyberTactics. All rights reserved.`
            : `© ${year} CyberTactics. Усі права захищені.`,
        })}
      </span>
      <Link to="/news" className="text-xs text-gray-400 hover:text-cyber-primary transition-colors">
        {t('news', {
          ns: 'ui',
          defaultValue: isEn ? 'News' : 'Новини',
        })}
      </Link>
      <Link
        to="/agreement"
        className="text-xs text-gray-400 hover:text-cyber-primary transition-colors"
      >
        {t('footerLink', { ns: 'agreement' })}
      </Link>
    </footer>
  );
}
