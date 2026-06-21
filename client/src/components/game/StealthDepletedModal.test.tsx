import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StealthDepletedModal from './StealthDepletedModal';

const { refreshUser, updateUser, closeStealthModal, purchaseStealthMasking } = vi.hoisted(() => ({
  refreshUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn(),
  closeStealthModal: vi.fn(),
  purchaseStealthMasking: vi.fn().mockResolvedValue({ stealth: 30 }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      user: { stealth: 0, xp: 100 },
      updateUser,
      refreshUser,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      stealthModalOpen: true,
      closeStealthModal,
      setStealthNotice: vi.fn(),
    }),
}));

vi.mock('../../services/api', () => ({
  api: {
    purchaseStealthMasking,
    waitForStealthRecovery: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

describe('StealthDepletedModal', () => {
  beforeEach(() => {
    refreshUser.mockClear();
    updateUser.mockClear();
    closeStealthModal.mockClear();
    purchaseStealthMasking.mockClear();
  });

  it('refreshes user and purchases masking', async () => {
    const user = userEvent.setup();

    render(<StealthDepletedModal />);

    await waitFor(() => {
      expect(refreshUser).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: 'stealthBuyMasking' }));

    await waitFor(() => {
      expect(purchaseStealthMasking).toHaveBeenCalled();
      expect(updateUser).toHaveBeenCalledWith({ stealth: 30 });
      expect(closeStealthModal).toHaveBeenCalled();
    });
  });
});
