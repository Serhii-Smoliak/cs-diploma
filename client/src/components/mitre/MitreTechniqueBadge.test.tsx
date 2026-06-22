import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MitreTechniqueBadge from './MitreTechniqueBadge';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

describe('MitreTechniqueBadge', () => {
  it('renders technique link and description', () => {
    render(
      <MitreTechniqueBadge
        technique={{
          id: 'T1593',
          name: 'Search Open Websites',
          tactic: 'reconnaissance',
          description: 'Gather data from public sites.',
          url: 'https://attack.mitre.org/techniques/T1593',
        }}
        showDescription
      />
    );

    expect(screen.getByRole('link', { name: /T1593/i })).toHaveAttribute(
      'href',
      'https://attack.mitre.org/techniques/T1593'
    );
    expect(screen.getByText('Search Open Websites')).toBeInTheDocument();
    expect(screen.getByText('Gather data from public sites.')).toBeInTheDocument();
  });
});
