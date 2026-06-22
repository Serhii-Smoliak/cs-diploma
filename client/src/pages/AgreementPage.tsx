import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

const SECTIONS = ['section1', 'section2', 'section3', 'section4', 'section5'] as const;

export default function AgreementPage() {
  const { t } = useTranslation('agreement');
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleBack = () => {
    navigate(isAuthenticated ? '/missions' : '/login');
  };

  return (
    <div className="min-h-screen bg-cyber-background text-white flex flex-col">
      <div className="flex-1 overflow-y-auto cyber-scrollbar">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary mb-4">
            {t('title')}
          </h1>

          <p className="text-gray-400 text-sm sm:text-base mb-8 leading-relaxed">{t('intro')}</p>

          <div className="cyber-panel p-5 sm:p-8 space-y-8">
            {SECTIONS.map((section) => (
              <section key={section}>
                <h2 className="font-heading font-bold text-lg text-cyber-primary mb-3">
                  {t(`${section}.title`)}
                </h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  {t(`${section}.body`)}
                </p>
              </section>
            ))}
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="mt-8 cyber-button px-6 py-2 text-sm"
          >
            {t('back')}
          </button>
        </div>
      </div>
    </div>
  );
}
