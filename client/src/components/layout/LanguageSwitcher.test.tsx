import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LanguageSwitcher from './LanguageSwitcher';

const { getLanguages, updatePreferredLocale, applyLocale, updateUser } = vi.hoisted(() => ({
  getLanguages: vi.fn().mockResolvedValue([
    { code: 'uk', name: 'Українська', flag: '🇺🇦', isActive: true },
    { code: 'en', name: 'English', flag: '🇬🇧', isActive: true },
  ]),
  updatePreferredLocale: vi.fn().mockResolvedValue({ id: 'u1', preferredLocale: 'en' }),
  applyLocale: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'uk', changeLanguage: vi.fn() },
  }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ user: { id: 'u1' }, updateUser }),
}));

vi.mock('../../services/api', () => ({
  api: { getLanguages, updatePreferredLocale },
}));

vi.mock('../../i18n/applyLocale', () => ({
  applyLocale,
}));

describe('LanguageSwitcher', () => {
  it('loads languages and switches locale', async () => {
    const user = userEvent.setup();

    render(<LanguageSwitcher />);

    await waitFor(() => {
      expect(screen.getByText('UK')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /UK/i }));
    await user.click(screen.getByRole('button', { name: /English/i }));

    await waitFor(() => {
      expect(applyLocale).toHaveBeenCalledWith('en');
      expect(updatePreferredLocale).toHaveBeenCalledWith('en');
      expect(updateUser).toHaveBeenCalled();
    });
  });
});
