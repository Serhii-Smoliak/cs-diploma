import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';

vi.mock('../i18n/applyLocale', () => ({
  applyLocale: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'uk' },
  }),
}));

describe('LanguageSelector', () => {
  it('renders language select', () => {
    render(
      <MemoryRouter>
        <LanguageSelector />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Select language')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
  });
});
