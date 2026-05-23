import { create } from 'zustand';
import type { Level, Mission, SubmitAnswerRequest, SubmitAnswerResponse } from '@cybertactics/shared';
import { api } from '../services/api';
import { useAuthStore } from './authStore';

interface LevelProgress {
  completed: boolean;
  lastAnswer: string | null;
}

interface GameState {
  currentMission: Mission | null;
  currentLevel: Level | null;
  levels: Level[];
  levelProgress: LevelProgress | null;
  retryMode: boolean;
  stealthModalOpen: boolean;
  stealthNotice: string | null;
  isLoading: boolean;
  error: string | null;

  setMission: (mission: Mission) => Promise<void>;
  loadLevel: (levelId: string) => Promise<void>;
  refreshLevelProgress: () => Promise<void>;
  setRetryMode: (retry: boolean) => void;
  openStealthModal: () => void;
  closeStealthModal: () => void;
  setStealthNotice: (notice: string | null) => void;
  submitAnswer: (answer: SubmitAnswerRequest['answer']) => Promise<SubmitAnswerResponse | null>;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentMission: null,
  currentLevel: null,
  levels: [],
  levelProgress: null,
  retryMode: false,
  stealthModalOpen: false,
  stealthNotice: null,
  isLoading: false,
  error: null,

  refreshLevelProgress: async () => {
    const { currentLevel } = get();
    const user = useAuthStore.getState().user;

    if (!currentLevel || !user?.id) {
      set({ levelProgress: null });
      return;
    }

    try {
      const progress = await api.getUserProgress(user.id);
      const levelProgress = progress.find((p) => p.levelId === currentLevel.level_id);
      set({
        levelProgress: {
          completed: levelProgress?.completed ?? false,
          lastAnswer: levelProgress?.lastAnswer ?? null,
        },
      });
    } catch (error) {
      console.error('Failed to load level progress:', error);
      set({ levelProgress: null });
    }
  },

  setRetryMode: (retry: boolean) => {
    set({ retryMode: retry });
  },

  openStealthModal: () => {
    set({ stealthModalOpen: true, stealthNotice: null });
  },

  closeStealthModal: () => {
    set({ stealthModalOpen: false });
  },

  setStealthNotice: (notice: string | null) => {
    set({ stealthNotice: notice });
  },

  setMission: async (mission: Mission) => {
    set({ isLoading: true, error: null });
    try {
      const levels = await api.getMissionLevels(mission.id);
      
      set({
        currentMission: mission,
        levels,
        currentLevel: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load mission',
        isLoading: false,
      });
    }
  },

  loadLevel: async (levelId: string) => {
    const { levels, currentMission, refreshLevelProgress } = get();

    const applyLevel = async (level: Level, loadedLevels?: Level[]) => {
      set({
        currentLevel: level,
        retryMode: false,
        levelProgress: null,
        ...(loadedLevels ? { levels: loadedLevels } : {}),
      });
      await refreshLevelProgress();
    };

    if (levels.length > 0) {
      const level = levels.find((l) => l.level_id === levelId);
      if (level) {
        await applyLevel(level);
        return;
      }
    }

    if (currentMission && levels.length === 0) {
      try {
        const loadedLevels = await api.getMissionLevels(currentMission.id);
        const level = loadedLevels.find((l) => l.level_id === levelId);
        if (level) {
          await applyLevel(level, loadedLevels);
          return;
        }
      } catch (error) {
        console.error('Failed to load levels:', error);
      }
    }

    try {
      const allMissions = await api.getMissions();
      for (const mission of allMissions) {
        const missionLevels = await api.getMissionLevels(mission.id);
        const level = missionLevels.find((l) => l.level_id === levelId);
        if (level) {
          set({
            currentMission: mission,
            levels: missionLevels,
            currentLevel: level,
            retryMode: false,
            levelProgress: null,
          });
          await refreshLevelProgress();
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load level from all missions:', error);
    }
  },

  submitAnswer: async (answer: SubmitAnswerRequest['answer']) => {
    const { currentLevel, openStealthModal } = get();
    if (!currentLevel) {
      throw new Error('No level selected');
    }

    const authUser = useAuthStore.getState().user;
    if ((authUser?.stealth ?? 100) <= 0) {
      openStealthModal();
      return {
        success: false,
        message: 'Stealth depleted',
        stealthDepleted: true,
      };
    }

    set({ isLoading: true, error: null });
    try {
      const result = await api.submitAnswer(currentLevel.level_id, answer);

      if (result.stealth !== undefined) {
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          authStore.updateUser({ stealth: result.stealth });
        }
      }

      if (result.stealthDepleted) {
        openStealthModal();
      }

      if (result.success && result.xpGained) {
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          authStore.updateUser({
            xp: (authStore.user.xp || 0) + result.xpGained,
          });
          authStore.refreshUser().catch(err => console.error('Failed to refresh user:', err));
        }
      }

      if (result.success) {
        const answerString =
          typeof answer === 'string' ? answer : JSON.stringify(answer);
        set({
          isLoading: false,
          levelProgress: {
            completed: true,
            lastAnswer: answerString,
          },
          retryMode: false,
        });
        return result;
      }
      
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to submit answer',
        isLoading: false,
      });
      throw error;
    }
  },

  reset: () => {
    set({
      currentMission: null,
      currentLevel: null,
      levels: [],
      levelProgress: null,
      retryMode: false,
      stealthModalOpen: false,
      stealthNotice: null,
      error: null,
    });
  },
}));

