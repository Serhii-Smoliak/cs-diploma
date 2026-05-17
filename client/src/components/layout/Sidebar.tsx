import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSidebarStore } from '../../store/sidebarStore';

export default function Sidebar() {
  const { t, i18n } = useTranslation(['ui']);
  const location = useLocation();
  const { isCollapsed, toggle } = useSidebarStore();

  const menuItems = [
    { path: '/missions', labelKey: 'missions', icon: '🎯' },
    { path: '/skill-matrix', labelKey: 'skillMatrix', icon: '⬡' },
    { path: '/leaderboard', labelKey: 'leaderboard', icon: '🏆' },
    { path: '/settings', labelKey: 'settings', icon: '⚙️' },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-cyber-panel border-r border-cyber-border flex flex-col transition-all duration-300 relative`}>
      {/* Logo */}
      <div className="p-4 border-b border-cyber-border flex items-center h-[73px] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyber-primary rounded-lg flex items-center justify-center text-cyber-background font-heading font-bold text-xl cyber-glow flex-shrink-0">
            C
          </div>
          {!isCollapsed && (
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/missions' && location.pathname === '/');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="block"
              title={isCollapsed ? t(item.labelKey, { ns: 'ui' }) : ''}
            >
              <motion.div
                whileHover={{ x: isCollapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-cyber-primary text-cyber-background cyber-glow'
                    : 'text-gray-300 hover:bg-cyber-panel hover:text-cyber-primary'
                }`}
              >
                <span className="text-xl flex-shrink-0 w-6 text-center ml-2">{item.icon}</span>
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {t(item.labelKey, { ns: 'ui' })}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-cyber-border">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggle}
          className={`w-full ${isCollapsed ? 'px-0 justify-center' : 'px-4'} flex items-center gap-3 py-3 rounded-lg transition-all duration-200 text-gray-300 hover:bg-cyber-panel hover:text-cyber-primary`}
          title={isCollapsed ? t('expandMenu') : t('collapseMenu')}
        >
          <motion.span 
            className="text-lg flex-shrink-0"
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
              className="font-medium whitespace-nowrap"
            >
              {t('collapse')}
            </motion.span>
          )}
        </motion.button>
      </div>
    </aside>
  );
}

