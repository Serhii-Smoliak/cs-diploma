import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AdminErrorPanel,
  AdminListSection,
  AdminLoadingPanel,
  adminCancelLabel,
  adminDeleteLabels,
  adminLoadingLabel,
  localizedDefault,
} from './adminPageUi';

const t = vi.fn((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key);

describe('adminPageUi', () => {
  it('returns localized default by locale', () => {
    expect(localizedDefault(false, 'Українська', 'English')).toBe('Українська');
    expect(localizedDefault(true, 'Українська', 'English')).toBe('English');
  });

  it('builds common admin labels', () => {
    expect(adminLoadingLabel(t, false)).toBe('Завантаження...');
    expect(adminCancelLabel(t, true)).toBe('Cancel');
    expect(adminDeleteLabels(t, false)).toEqual({
      confirmLabel: 'Видалити',
      loadingLabel: 'Видалення...',
    });
  });

  it('renders loading, error and list section panels', () => {
    render(
      <>
        <AdminLoadingPanel label="Loading..." />
        <AdminErrorPanel message="Failed" />
        <AdminListSection title="Items">
          <p>List body</p>
        </AdminListSection>
      </>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Items' })).toBeInTheDocument();
    expect(screen.getByText('List body')).toBeInTheDocument();
  });
});
