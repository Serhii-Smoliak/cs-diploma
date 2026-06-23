import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Footer from './Footer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; year?: number }) =>
      options?.defaultValue?.replace('{{year}}', String(options.year ?? '')) ?? key,
    i18n: { resolvedLanguage: 'uk' },
  }),
}));

describe('Footer', () => {
  it('shows copyright, news and agreement links', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText(/CyberTactics\. Усі права захищені\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Новини' })).toHaveAttribute('href', '/news');
    expect(screen.getByRole('link', { name: 'footerLink' })).toHaveAttribute('href', '/agreement');
  });
});
