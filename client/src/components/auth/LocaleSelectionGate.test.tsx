import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LocaleSelectionGate from './LocaleSelectionGate';

const updateUser = vi.fn();

const { updatePreferredLocale, applyLocale } = vi.hoisted(() => ({
  updatePreferredLocale: vi.fn().mockResolvedValue({ id: 'u1', preferredLocale: 'uk' }),
  applyLocale: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      user: { id: 'u1', username: 'agent', preferredLocale: null },
      updateUser,
    }),
}));

vi.mock('../../services/api', () => ({
  api: { updatePreferredLocale },
}));

vi.mock('../../i18n/applyLocale', () => ({
  applyLocale,
}));

vi.mock('./LocaleSelectionModal', () => ({
  default: ({ onSelect }: { onSelect: (locale: string) => void }) => (
    <button type="button" onClick={() => onSelect('uk')}>
      pick-uk
    </button>
  ),
}));

describe('LocaleSelectionGate', () => {
  it('shows locale modal when preferred locale is missing', async () => {
    const user = userEvent.setup();

    render(
      <LocaleSelectionGate>
        <div>protected-content</div>
      </LocaleSelectionGate>
    );

    expect(screen.queryByText('protected-content')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'pick-uk' }));

    await waitFor(() => {
      expect(updatePreferredLocale).toHaveBeenCalledWith('uk');
      expect(updateUser).toHaveBeenCalled();
      expect(applyLocale).toHaveBeenCalledWith('uk');
    });
  });
});
