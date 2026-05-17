import { create } from 'zustand';
import type { Level, Mission, SubmitAnswerResponse } from '@cybertactics/shared';
import { api } from '../services/api';
import { useAuthStore } from './authStore';

interface GameState {
  currentMission: Mission | null;
  currentLevel: Level | null;
  levels: Level[];
  isLoading: boolean;
  error: string | null;

  setMission: (mission: Mission) => Promise<void>;
  loadLevel: (levelId: string) => Promise<void>;
  submitAnswer: (answer: string | number | any) => Promise<SubmitAnswerResponse>;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentMission: null,
  currentLevel: null,
  levels: [],
  isLoading: false,
  error: null,

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
    const { levels, currentMission } = get();

    if (levels.length > 0) {
      const level = levels.find((l) => l.level_id === levelId);
      if (level) {
        set({ currentLevel: level });
        return;
      }
    }

    if (currentMission && levels.length === 0) {
      try {
        const loadedLevels = await api.getMissionLevels(currentMission.id);
        const level = loadedLevels.find((l) => l.level_id === levelId);
        if (level) {
          set({ 
            currentLevel: level,
            levels: loadedLevels
          });
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
            currentLevel: level
          });
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load level from all missions:', error);
    }
  },

  submitAnswer: async (answer: string | number | any) => {
    const { currentLevel } = get();
    if (!currentLevel) {
      throw new Error('No level selected');
    }

    set({ isLoading: true, error: null });
    try {
      const result = await api.submitAnswer(currentLevel.level_id, answer);

      if (result.success && result.xpGained) {
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          authStore.updateUser({
            xp: (authStore.user.xp || 0) + result.xpGained,
            stealth: Math.max(0, Math.min(100, (authStore.user.stealth || 100) + (result.stealthChange || 0))),
          });
          authStore.refreshUser().catch(err => console.error('Failed to refresh user:', err));
        }
      }
      
      if (!result.success && result.stealthChange) {
        const authStore = useAuthStore.getState();
        if (authStore.user) {
          authStore.updateUser({
            stealth: Math.max(0, (authStore.user.stealth || 100) + result.stealthChange),
          });
        }
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
      error: null,
    });
  },
}));

