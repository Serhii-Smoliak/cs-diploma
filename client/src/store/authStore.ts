import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@cybertactics/shared';
import { api } from '../services/api';
import { applyLocale } from '../i18n/applyLocale';
import {
  registerSessionExpiredHandler,
  resetSessionExpiredGuard,
} from '../auth/sessionExpired';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

async function syncUserLocale(user: User): Promise<void> {
  if (user.preferredLocale) {
    await applyLocale(user.preferredLocale);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const { user } = await api.login(email, password);
        resetSessionExpiredGuard();
        set({ user, isAuthenticated: true });
        await syncUserLocale(user);
      },

      register: async (username: string, email: string, password: string) => {
        const { user } = await api.register(username, email, password);
        resetSessionExpiredGuard();
        set({ user, isAuthenticated: true });
        await syncUserLocale(user);
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
        if (!api.getToken()) {
          if (get().isAuthenticated) {
            get().logout();
          }
          return;
        }

        try {
          const profile = await api.getCurrentUser();
          set({ user: profile, isAuthenticated: true });
          if (profile.preferredLocale) {
            await applyLocale(profile.preferredLocale);
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
    }),
    {
      name: 'cybertactics-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

registerSessionExpiredHandler(() => {
  useAuthStore.getState().logout();
});
