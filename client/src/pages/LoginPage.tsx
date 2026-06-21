import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import Footer from '../components/layout/Footer';

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'agreement']);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username) {
          setError(t('usernameRequired'));
          setLoading(false);
          return;
        }
        if (!agreementAccepted) {
          setError(t('agreementRequired'));
          setLoading(false);
          return;
        }
        await register(username, email, password);
      }
      navigate('/missions');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cyber-panel p-5 sm:p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-cyber-primary rounded-lg flex items-center justify-center text-cyber-background font-heading font-bold text-2xl cyber-glow mx-auto mb-4">
            C
          </div>
          <h1 className="font-heading font-bold text-2xl text-cyber-primary mb-2">CyberTactics</h1>
          <p className="text-sm text-gray-400">
            {isLogin ? t('loginSubtitle') : t('registerSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-cyber-primary mb-2">
                {t('username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full cyber-input"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-cyber-primary mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full cyber-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyber-primary mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full cyber-input"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(e) => {
                  setAgreementAccepted(e.target.checked);
                  if (e.target.checked) setError('');
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-cyber-border bg-cyber-panel text-cyber-primary focus:ring-cyber-primary focus:ring-offset-cyber-background"
              />
              <span className="text-sm text-gray-400 leading-snug group-hover:text-gray-300">
                {t('acceptAgreementPrefix', { ns: 'auth' })}{' '}
                <Link
                  to="/agreement"
                  className="text-cyber-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t('footerLink', { ns: 'agreement' })}
                </Link>
              </span>
            </label>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || (!isLogin && !agreementAccepted)}
            className="w-full cyber-button py-3 disabled:opacity-50"
          >
            {loading ? t('loading') : isLogin ? t('login') : t('register')}
          </motion.button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setAgreementAccepted(false);
            }}
            className="text-sm text-cyber-primary hover:underline"
          >
            {isLogin ? t('switchToRegister') : t('switchToLogin')}
          </button>
        </div>
      </motion.div>
      </div>
      <Footer />
    </div>
  );
}
