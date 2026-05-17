import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@cybertactics/shared';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const { user } = await api.login(email, password);
        set({ user, isAuthenticated: true });
      },

      register: async (username: string, email: string, password: string) => {
        const { user } = await api.register(username, email, password);
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        api.clearToken();
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      refreshUser: async () => {
        const { user } = get();
        if (user?.id) {
          try {
            const stats = await api.getUserStats(user.id);
            set({
              user: {
                ...user,
                xp: stats.totalXp,
                rank: stats.rank,
                stealth: stats.stealth,
              },
            });
          } catch (error) {
            console.error('Failed to refresh user:', error);
          }
        }
      },
    }),
    {
      name: 'cybertactics-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

