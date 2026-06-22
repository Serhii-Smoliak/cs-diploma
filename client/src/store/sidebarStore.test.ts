import { describe, expect, it, vi } from 'vitest';

vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual<typeof import('zustand/middleware')>('zustand/middleware');
  return {
    ...actual,
    persist: ((initializer: unknown) => initializer) as typeof actual.persist,
  };
});

import { useSidebarStore } from './sidebarStore';

describe('useSidebarStore', () => {
  it('toggles collapsed and mobile sidebar state', () => {
    useSidebarStore.setState({ isCollapsed: false, isMobileOpen: false });

    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isCollapsed).toBe(true);

    useSidebarStore.getState().setCollapsed(false);
    expect(useSidebarStore.getState().isCollapsed).toBe(false);

    useSidebarStore.getState().openMobile();
    expect(useSidebarStore.getState().isMobileOpen).toBe(true);

    useSidebarStore.getState().closeMobile();
    expect(useSidebarStore.getState().isMobileOpen).toBe(false);
  });
});
