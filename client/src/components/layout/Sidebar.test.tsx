import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

const sidebarState = vi.hoisted(() => ({
  isCollapsed: false,
  isMobileOpen: true,
  toggle: vi.fn(),
  closeMobile: vi.fn(),
}));

const authState = vi.hoisted(() => ({
  role: 'ADMIN' as 'USER' | 'ADMIN',
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: { resolvedLanguage: 'uk' },
  }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (state: { user: { role: 'USER' | 'ADMIN' } | null }) => unknown) => {
    const state = { user: { role: authState.role } };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../store/sidebarStore', () => ({
  useSidebarStore: (selector?: (state: typeof sidebarState) => unknown) => {
    const state = {
      isCollapsed: sidebarState.isCollapsed,
      isMobileOpen: sidebarState.isMobileOpen,
      toggle: sidebarState.toggle,
      closeMobile: sidebarState.closeMobile,
    };
    return selector ? selector(state) : state;
  },
}));

describe('Sidebar', () => {
  beforeEach(() => {
    authState.role = 'ADMIN';
    sidebarState.isCollapsed = false;
    sidebarState.isMobileOpen = true;
    sidebarState.toggle.mockClear();
    sidebarState.closeMobile.mockClear();
  });

  it('renders navigation links and toggles collapse', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/missions']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('CyberTactics')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Місії/i })).toHaveAttribute('href', '/missions');
    expect(screen.getByRole('link', { name: /Звернення/i })).toHaveAttribute(
      'href',
      '/admin/tickets'
    );

    await user.click(screen.getByTitle('collapseMenu'));
    expect(sidebarState.toggle).toHaveBeenCalled();
  });

  it('shows icon-only links when collapsed on desktop', () => {
    sidebarState.isCollapsed = true;
    sidebarState.isMobileOpen = false;

    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.queryByText('CyberTactics')).not.toBeInTheDocument();
    expect(screen.getByTitle('Місії')).toHaveAttribute('href', '/missions');
    expect(screen.getByTitle('Звернення')).toHaveAttribute('href', '/admin/tickets');
  });

  it('closes mobile menu when a navigation link is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/missions']}>
        <Sidebar />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('link', { name: /Місії/i }));
    expect(sidebarState.closeMobile).toHaveBeenCalled();
  });

  it('hides admin links for regular users', () => {
    authState.role = 'USER';

    render(
      <MemoryRouter initialEntries={['/missions']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /Звернення/i })).not.toBeInTheDocument();
  });
});
