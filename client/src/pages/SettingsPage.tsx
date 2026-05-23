import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation(['ui']);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading font-bold text-3xl text-cyber-primary mb-8">
        {t('settings', { ns: 'ui' })}
      </h1>
      <div className="cyber-panel p-8 text-center text-gray-400">
        {t('inDevelopment', { ns: 'ui' })}
      </div>
    </div>
  );
}
