import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';

const refreshUser = vi.fn().mockResolvedValue(undefined);
const closeMobile = vi.fn();

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      isAuthenticated: true,
      refreshUser,
    }),
}));

vi.mock('../../store/sidebarStore', () => ({
  useSidebarStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      isMobileOpen: true,
      closeMobile,
    }),
}));

vi.mock('./Sidebar', () => ({
  default: () => <aside>sidebar</aside>,
}));

vi.mock('./TopBar', () => ({
  default: () => <header>topbar</header>,
}));

vi.mock('./Footer', () => ({
  default: () => <footer>footer</footer>,
}));

vi.mock('../game/StealthDepletedModal', () => ({
  default: () => <div>stealth-modal</div>,
}));

describe('Layout', () => {
  it('renders shell and closes mobile menu on navigation', () => {
    render(
      <MemoryRouter initialEntries={['/missions']}>
        <Layout>
          <div>page-content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText('sidebar')).toBeInTheDocument();
    expect(screen.getByText('topbar')).toBeInTheDocument();
    expect(screen.getByText('page-content')).toBeInTheDocument();
    expect(screen.getByText('stealth-modal')).toBeInTheDocument();
    expect(refreshUser).toHaveBeenCalled();
    expect(closeMobile).toHaveBeenCalled();
  });
});
