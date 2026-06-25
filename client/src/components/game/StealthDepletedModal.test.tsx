import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StealthDepletedModal from './StealthDepletedModal';

const {
  refreshUser,
  updateUser,
  closeStealthModal,
  purchaseStealthMasking,
  getStealthRecoveryStatus,
  authState,
} = vi.hoisted(() => ({
  refreshUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn(),
  closeStealthModal: vi.fn(),
  purchaseStealthMasking: vi.fn().mockResolvedValue({ stealth: 30 }),
  getStealthRecoveryStatus: vi.fn().mockResolvedValue({
    stealth: 0,
    ready: false,
    alreadyAtMax: false,
    retryAfterMs: 3_600_000,
    regenAmount: 10,
  }),
  authState: {
    user: { stealth: 0, xp: 100 } as { stealth: number; xp: number } | null,
    language: 'en',
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { time?: string; amount?: number; defaultValue?: string }) => {
      if (options?.time && options?.amount !== undefined) {
        return `${key}:${options.amount}:${options.time}`;
      }
      return options?.defaultValue ?? key;
    },
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
  useAuthStore: Object.assign(
    (selector?: (state: Record<string, unknown>) => unknown) => {
      const state = {
        user: authState.user,
        updateUser,
        refreshUser,
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        user: authState.user,
        updateUser,
        refreshUser,
      }),
    }
  ),
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      stealthModalOpen: true,
      closeStealthModal,
    }),
}));

vi.mock('../../services/api', () => ({
  api: {
    purchaseStealthMasking,
    getStealthRecoveryStatus,
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
    getStealthRecoveryStatus.mockClear();
    getStealthRecoveryStatus.mockResolvedValue({
      stealth: authState.user?.stealth ?? 0,
      ready: false,
      alreadyAtMax: false,
      retryAfterMs: 3_600_000,
      regenAmount: 10,
    });
  });

  it('loads passive recovery status on open', async () => {
    render(<StealthDepletedModal />);

    await waitFor(() => {
      expect(getStealthRecoveryStatus).toHaveBeenCalled();
    });
  });

  it('shows passive recovery countdown', async () => {
    authState.user = { stealth: 80, xp: 100 };
    getStealthRecoveryStatus.mockResolvedValueOnce({
      stealth: 80,
      ready: false,
      alreadyAtMax: false,
      retryAfterMs: 2_400_000,
      regenAmount: 10,
    });

    render(<StealthDepletedModal />);

    expect(await screen.findByText('stealthPassiveRecoveryIn:10:40m')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'stealthWaitRecovery' })).not.toBeInTheDocument();
  });

  it('shows at-max message without wait button', async () => {
    authState.user = { stealth: 100, xp: 100 };
    getStealthRecoveryStatus.mockResolvedValueOnce({
      stealth: 100,
      ready: false,
      alreadyAtMax: true,
      retryAfterMs: 0,
      regenAmount: 10,
    });

    render(<StealthDepletedModal />);

    expect(await screen.findByText('Stealth is already at 100%.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'stealthWaitRecovery' })).not.toBeInTheDocument();
  });

  it('purchases masking', async () => {
    const user = userEvent.setup();

    render(<StealthDepletedModal />);

    await waitFor(() => {
      expect(getStealthRecoveryStatus).toHaveBeenCalled();
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

    expect(await screen.findByText('Stealth')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buy 50% masking/i })).toBeDisabled();
    expect(screen.getByText(/Masking \(\+50%\) would exceed 100%/)).toBeInTheDocument();
  });

  it('returns null without authenticated user', () => {
    authState.user = null;

    const { container } = render(<StealthDepletedModal />);

    expect(container).toBeEmptyDOMElement();
  });
});
