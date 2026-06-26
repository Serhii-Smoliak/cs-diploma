import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';

export default function Sidebar() {
  const { t, i18n } = useTranslation(['ui', 'common']);
  const isEn = i18n.resolvedLanguage?.startsWith('en') ?? false;
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebarStore();
  const isAdmin = user?.role === 'ADMIN';

  const regularMenuItems = [
    { path: '/missions', labelKey: 'missions', icon: '🎯' },
    { path: '/skill-matrix', labelKey: 'skillMatrix', icon: '⬡' },
    { path: '/leaderboard', labelKey: 'leaderboard', icon: '🏆' },
    { path: '/faq', labelKey: 'faq', icon: '❓' },
    { path: '/community', labelKey: 'community', icon: '💬' },
    { path: '/support', labelKey: 'support', icon: '📩' },
    { path: '/news', labelKey: 'news', icon: '📰' },
  ];

  const adminMenuItems = isAdmin
    ? [
        { path: '/admin/tickets', labelKey: 'adminTickets', icon: '📋' as const },
        { path: '/admin/news', labelKey: 'adminNews', icon: '📰' as const },
        { path: '/settings', labelKey: 'settings', icon: '⚙️' as const },
      ]
    : [];

  const showLabels = isMobileOpen || !isCollapsed;

  type MenuItem = (typeof regularMenuItems)[number] | (typeof adminMenuItems)[number];

  const renderMenuItem = (item: MenuItem, isActive: boolean) => (
    <Link
      key={item.path}
      to={item.path}
      className="block"
      title={showLabels ? undefined : getNavLabel(item.labelKey)}
      onClick={closeMobile}
    >
      <motion.div
        whileHover={{ x: showLabels ? 4 : 0 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-cyber-primary text-cyber-background cyber-glow'
            : 'text-gray-300 hover:bg-cyber-panel hover:text-cyber-primary'
        }`}
      >
        <span className="text-xl flex-shrink-0 w-6 text-center ml-2">{item.icon}</span>
        {showLabels && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-medium whitespace-nowrap"
          >
            {getNavLabel(item.labelKey)}
          </motion.span>
        )}
      </motion.div>
    </Link>
  );

  const getNavLabel = (labelKey: string) => {
    const defaults: Record<string, { uk: string; en: string }> = {
      missions: { uk: 'Місії', en: 'Missions' },
      skillMatrix: { uk: 'Навички', en: 'Skill Matrix' },
      leaderboard: { uk: 'Таблиця лідерів', en: 'Leaderboard' },
      faq: { uk: 'FAQ', en: 'FAQ' },
      community: { uk: 'Спільнота', en: 'Community' },
      support: { uk: 'Підтримка', en: 'Support' },
      news: { uk: 'Новини', en: 'News' },
      adminTickets: { uk: 'Звернення', en: 'Support tickets' },
      adminNews: { uk: 'Новини (адмін)', en: 'News admin' },
      settings: { uk: 'Налаштування', en: 'Settings' },
    };

    const fallback = defaults[labelKey];
    let defaultValue = labelKey;
    if (fallback) {
      defaultValue = isEn ? fallback.en : fallback.uk;
    }

    return t(labelKey, {
      ns: 'ui',
      defaultValue,
    });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-cyber-panel border-r border-cyber-border transition-all duration-300 w-64 lg:relative lg:translate-x-0 lg:z-auto ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
    >
      <div className="p-4 border-b border-cyber-border flex items-center justify-between h-[73px] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-cyber-primary rounded-lg flex items-center justify-center text-cyber-background font-heading font-bold text-xl cyber-glow flex-shrink-0">
            C
          </div>
          {showLabels && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-heading font-bold text-xl text-cyber-primary whitespace-nowrap"
            >
              CyberTactics
            </motion.h1>
          )}
        </div>
        <button
          type="button"
          onClick={closeMobile}
          className="lg:hidden text-gray-400 hover:text-cyber-primary text-xl leading-none px-2"
          aria-label={t('close', { ns: 'common' })}
        >
          ×
        </button>
      </div>

      <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto">
        {regularMenuItems.map((item) =>
          renderMenuItem(
            item,
            location.pathname === item.path ||
              (item.path === '/missions' && location.pathname === '/')
          )
        )}

        {adminMenuItems.length > 0 && (
          <hr className="border-0 border-t border-cyber-border/80 my-2" aria-hidden />
        )}

        {adminMenuItems.map((item) => renderMenuItem(item, location.pathname === item.path))}
      </nav>

      <div className="shrink-0 h-11 border-t border-cyber-border hidden lg:flex items-center px-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          className="w-full h-8 flex items-center justify-center gap-2 rounded-lg transition-all duration-200 text-gray-300 hover:bg-cyber-panel hover:text-cyber-primary"
          title={isCollapsed ? t('expandMenu') : t('collapseMenu')}
        >
          <motion.span
            className="text-sm flex-shrink-0 leading-none"
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ◄
          </motion.span>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-medium whitespace-nowrap"
            >
              {t('collapse')}
            </motion.span>
          )}
        </motion.button>
      </div>
    </aside>
  );
}
