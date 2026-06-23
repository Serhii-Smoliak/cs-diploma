import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import MissionsPage from './pages/MissionsPage';
import MissionAssignmentsPage from './pages/MissionAssignmentsPage';
import SkillMatrixPage from './pages/SkillMatrixPage';
import LeaderboardPage from './pages/LeaderboardPage';
import RanksPage from './pages/RanksPage';
import FaqPage from './pages/FaqPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import AdminTicketsPage from './pages/AdminTicketsPage';
import AdminNewsPage from './pages/AdminNewsPage';
import NewsPage from './pages/NewsPage';
import AgreementPage from './pages/AgreementPage';
import GameLayout from './components/game/GameLayout';
import LocaleSelectionGate from './components/auth/LocaleSelectionGate';
import AdminRoute from './components/auth/AdminRoute';
import { useGameStore } from './store/gameStore';
import { api } from './services/api';
import { registerSessionExpiredHandler } from './auth/sessionExpired';

registerSessionExpiredHandler(() => {
  useGameStore.getState().reset();
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation(['common']);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      if (!api.getToken()) {
        if (isAuthenticated) {
          useAuthStore.getState().logout();
        }
        if (!cancelled) {
          setSessionChecked(true);
        }
        return;
      }

      if (isAuthenticated) {
        await refreshUser();
      }

      if (!cancelled) {
        setSessionChecked(true);
      }
    };

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshUser]);

  if (!sessionChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-cyber-background text-cyber-primary font-heading">
        {t('loading', { ns: 'common', defaultValue: 'Loading...' })}
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function GameRoute() {
  const { t } = useTranslation(['ui']);
  const { missionId, assignmentId } = useParams<{ missionId: string; assignmentId: string }>();
  const currentMission = useGameStore((state) => state.currentMission);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const setMission = useGameStore((state) => state.setMission);
  const loadLevel = useGameStore((state) => state.loadLevel);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRestoredRef = useRef<string | null>(null);

  useEffect(() => {
    const restoreState = async () => {
      if (!missionId || !assignmentId) {
        setIsRestoring(false);
        return;
      }

      const stateKey = `${missionId}-${assignmentId}`;

      if (hasRestoredRef.current === stateKey) {
        setIsRestoring(false);
        return;
      }

      if (currentMission?.id === missionId && currentLevel?.level_id === assignmentId) {
        hasRestoredRef.current = stateKey;
        setIsRestoring(false);
        return;
      }

      try {
        setIsRestoring(true);
        setError(null);

        const missions = await api.getMissions();
        const mission = missions.find((m) => m.id === missionId);

        if (!mission) {
          setError('Місія не знайдена');
          setIsRestoring(false);
          return;
        }

        await setMission(mission);

        const levels = await api.getMissionLevels(missionId);
        const level = levels.find((l) => l.level_id === assignmentId);

        if (!level) {
          setError('Завдання не знайдено');
          setIsRestoring(false);
          return;
        }

        await loadLevel(assignmentId);
        hasRestoredRef.current = stateKey;
      } catch (err) {
        console.error('Failed to restore game state:', err);
        setError(err instanceof Error ? err.message : 'Помилка завантаження');
      } finally {
        setIsRestoring(false);
      }
    };

    restoreState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, assignmentId]);

  if (isRestoring) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyber-primary font-heading">
          {t('loadingAssignment', { ns: 'ui' })}
        </div>
      </div>
    );
  }

  if (error || !currentMission || !currentLevel) {
    return <Navigate to="/missions" replace />;
  }

  return <GameLayout />;
}

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/missions" replace /> : <LoginPage />}
      />
      <Route path="/agreement" element={<AgreementPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <LocaleSelectionGate>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/missions" replace />} />
                  <Route path="/missions" element={<MissionsPage />} />
                  <Route
                    path="/missions/:missionId/assignments"
                    element={<MissionAssignmentsPage />}
                  />
                  <Route
                    path="/missions/:missionId/assignments/:assignmentId"
                    element={<GameRoute />}
                  />
                  <Route path="/skill-matrix" element={<SkillMatrixPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/ranks" element={<RanksPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news/:newsId" element={<NewsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="/admin/tickets"
                    element={
                      <AdminRoute>
                        <AdminTicketsPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/news"
                    element={
                      <AdminRoute>
                        <AdminNewsPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <AdminRoute>
                        <SettingsPage />
                      </AdminRoute>
                    }
                  />
                </Routes>
              </Layout>
            </LocaleSelectionGate>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export { GameRoute };

export default App;
