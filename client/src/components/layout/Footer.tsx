import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('agreement');

  return (
    <footer className="shrink-0 h-11 flex items-center justify-center border-t border-cyber-border bg-cyber-panel px-4">
      <Link to="/agreement" className="text-xs text-gray-400 hover:text-cyber-primary transition-colors">
        {t('footerLink')}
      </Link>
    </footer>
  );
}
