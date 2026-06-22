import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StealthDepletedModal from './StealthDepletedModal';
import { ApiError } from '../../services/api';

const {
  refreshUser,
  updateUser,
  closeStealthModal,
  purchaseStealthMasking,
  waitForStealthRecovery,
  setStealthNotice,
} = vi.hoisted(() => ({
  refreshUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn(),
  closeStealthModal: vi.fn(),
  setStealthNotice: vi.fn(),
  purchaseStealthMasking: vi.fn().mockResolvedValue({ stealth: 30 }),
  waitForStealthRecovery: vi.fn().mockResolvedValue({ stealth: 15 }),
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
      setStealthNotice,
    }),
}));

vi.mock('../../services/api', () => ({
  api: {
    purchaseStealthMasking,
    waitForStealthRecovery,
  },
  ApiError: class ApiError extends Error {
    status: number;
    body: Record<string, unknown>;
    constructor(message: string, status: number, body: Record<string, unknown> = {}) {
      super(message);
      this.status = status;
      this.body = body;
    }
  },
}));

describe('StealthDepletedModal', () => {
  beforeEach(() => {
    refreshUser.mockClear();
    updateUser.mockClear();
    closeStealthModal.mockClear();
    purchaseStealthMasking.mockClear();
    waitForStealthRecovery.mockClear();
    setStealthNotice.mockClear();
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

  it('shows notice when masking purchase fails', async () => {
    purchaseStealthMasking.mockRejectedValueOnce(new Error('fail'));
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthBuyMasking' }));

    expect(await screen.findByText('stealthMaskingFailed')).toBeInTheDocument();
  });

  it('waits for stealth recovery', async () => {
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthWaitRecovery' }));

    await waitFor(() => {
      expect(waitForStealthRecovery).toHaveBeenCalled();
      expect(updateUser).toHaveBeenCalledWith({ stealth: 15 });
      expect(closeStealthModal).toHaveBeenCalled();
    });
  });

  it('handles 429 wait recovery with retry notice', async () => {
    waitForStealthRecovery.mockRejectedValueOnce(
      new ApiError('Too many requests', 429, { retryAfterMs: 90000, stealth: 5 })
    );
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthWaitRecovery' }));

    await waitFor(() => {
      expect(setStealthNotice).toHaveBeenCalled();
      expect(updateUser).toHaveBeenCalledWith({ stealth: 5 });
      expect(closeStealthModal).toHaveBeenCalled();
    });
  });

  it('shows premium mock notice', async () => {
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthUpgradePlan' }));

    expect(await screen.findByText('stealthPremiumMock')).toBeInTheDocument();
  });

  it('closes on escape key', async () => {
    render(<StealthDepletedModal />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(closeStealthModal).toHaveBeenCalled();
  });
});
