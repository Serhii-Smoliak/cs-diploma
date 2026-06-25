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
  authState,
} = vi.hoisted(() => ({
  refreshUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn(),
  closeStealthModal: vi.fn(),
  setStealthNotice: vi.fn(),
  purchaseStealthMasking: vi.fn().mockResolvedValue({ stealth: 30 }),
  waitForStealthRecovery: vi.fn().mockResolvedValue({ stealth: 15 }),
  authState: {
    user: { stealth: 0, xp: 100 } as { stealth: number; xp: number } | null,
    language: 'en',
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { time?: string; defaultValue?: string }) =>
      options?.time ? `${key}:${options.time}` : (options?.defaultValue ?? key),
    i18n: { language: authState.language },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
      <div onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      user: authState.user,
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
    authState.user = { stealth: 0, xp: 100 };
    authState.language = 'en';
    refreshUser.mockClear();
    refreshUser.mockResolvedValue(undefined);
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

    await user.click(screen.getByRole('button', { name: /Buy 50% masking/i }));

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
    await user.click(await screen.findByRole('button', { name: /Buy 50% masking/i }));

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
      expect(setStealthNotice).toHaveBeenCalledWith('stealthWaitNotReady:2m');
      expect(updateUser).toHaveBeenCalledWith({ stealth: 5 });
      expect(closeStealthModal).toHaveBeenCalled();
    });
  });

  it('formats retry time in ukrainian hours and minutes', async () => {
    authState.language = 'uk';
    waitForStealthRecovery.mockRejectedValueOnce(
      new ApiError('Too many requests', 429, { retryAfterMs: 5400000, stealth: 0 })
    );
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthWaitRecovery' }));

    await waitFor(() => {
      expect(setStealthNotice).toHaveBeenCalledWith('stealthWaitNotReady:1 год 30 хв');
    });
  });

  it('formats retry time in seconds when under one minute', async () => {
    waitForStealthRecovery.mockRejectedValueOnce(
      new ApiError('Too many requests', 429, { retryAfterMs: 45000, stealth: 0 })
    );
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthWaitRecovery' }));

    await waitFor(() => {
      expect(setStealthNotice).toHaveBeenCalledWith('stealthWaitNotReady:45s');
    });
  });

  it('formats retry time in minutes only', async () => {
    waitForStealthRecovery.mockRejectedValueOnce(
      new ApiError('Too many requests', 429, { retryAfterMs: 120000, stealth: 0 })
    );
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthWaitRecovery' }));

    await waitFor(() => {
      expect(setStealthNotice).toHaveBeenCalledWith('stealthWaitNotReady:2m');
    });
  });

  it('formats retry time in whole hours only', async () => {
    waitForStealthRecovery.mockRejectedValueOnce(
      new ApiError('Too many requests', 429, { retryAfterMs: 7200000, stealth: 0 })
    );
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthWaitRecovery' }));

    await waitFor(() => {
      expect(setStealthNotice).toHaveBeenCalledWith('stealthWaitNotReady:2h');
    });
  });

  it('formats retry time in ukrainian whole hours only', async () => {
    authState.language = 'uk';
    waitForStealthRecovery.mockRejectedValueOnce(
      new ApiError('Too many requests', 429, { retryAfterMs: 3600000, stealth: 0 })
    );
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthWaitRecovery' }));

    await waitFor(() => {
      expect(setStealthNotice).toHaveBeenCalledWith('stealthWaitNotReady:1 год');
    });
  });

  it('shows notice when wait recovery fails', async () => {
    waitForStealthRecovery.mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthWaitRecovery' }));

    expect(await screen.findByText('stealthWaitFailed')).toBeInTheDocument();
  });

  it('shows premium mock notice', async () => {
    const user = userEvent.setup();

    render(<StealthDepletedModal />);
    await user.click(await screen.findByRole('button', { name: 'stealthUpgradePlan' }));

    expect(await screen.findByText('stealthPremiumMock')).toBeInTheDocument();
  });

  it('closes on escape key and backdrop click', async () => {
    render(<StealthDepletedModal />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(closeStealthModal).toHaveBeenCalledTimes(1);

    fireEvent.click(document.querySelector('.backdrop-blur-sm')!);
    expect(closeStealthModal).toHaveBeenCalledTimes(2);
  });

  it('renders manage mode for partial stealth and disables masking near max', async () => {
    authState.user = { stealth: 60, xp: 100 };

    render(<StealthDepletedModal />);

    expect(screen.getByText('Stealth')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buy 50% masking/i })).toBeDisabled();
    expect(screen.getByText(/Masking \(\+50%\) would exceed 100%/)).toBeInTheDocument();
  });

  it('disables wait recovery when stealth is already at max', async () => {
    authState.user = { stealth: 100, xp: 100 };

    render(<StealthDepletedModal />);

    expect(screen.getByRole('button', { name: 'stealthWaitRecovery' })).toBeDisabled();
    expect(screen.getByText('Stealth is already at 100%.')).toBeInTheDocument();
  });

  it('returns null without authenticated user', () => {
    authState.user = null;

    const { container } = render(<StealthDepletedModal />);

    expect(container).toBeEmptyDOMElement();
  });
});
