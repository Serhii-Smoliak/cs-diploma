import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

const sidebarState = vi.hoisted(() => ({
  isCollapsed: false,
  isMobileOpen: true,
  toggle: vi.fn(),
  closeMobile: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
  it('renders navigation links and toggles collapse', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/missions']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('CyberTactics')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /missions/i })).toHaveAttribute('href', '/missions');

    await user.click(screen.getByTitle('collapseMenu'));
    expect(sidebarState.toggle).toHaveBeenCalled();
  });
});
