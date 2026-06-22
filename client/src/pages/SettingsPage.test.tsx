import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsPage from './SettingsPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('SettingsPage', () => {
  it('renders settings placeholder', () => {
    render(<SettingsPage />);
    expect(screen.getByText('settings')).toBeInTheDocument();
    expect(screen.getByText('inDevelopment')).toBeInTheDocument();
  });
});
