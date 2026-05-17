import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-3xl text-cyber-primary mb-8">Settings</h1>
      
      <div className="cyber-panel p-6 space-y-4">
        <div>
          <h2 className="font-heading font-bold text-lg text-cyber-primary mb-4">Account</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Username:</span>{' '}
              <span className="text-white">{user?.username}</span>
            </div>
            <div>
              <span className="text-gray-400">Email:</span>{' '}
              <span className="text-white">{user?.email}</span>
            </div>
            <div>
              <span className="text-gray-400">Rank:</span>{' '}
              <span className="text-cyber-primary">{user?.rank}</span>
            </div>
            <div>
              <span className="text-gray-400">XP:</span>{' '}
              <span className="text-cyber-success">{user?.xp}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-cyber-border">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="cyber-button-danger"
          >
            Logout
          </motion.button>
        </div>
      </div>
    </div>
  );
}

