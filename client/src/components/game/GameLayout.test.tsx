import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GameLayout from './GameLayout';
import { createTestLevel, testMission } from '../../test/fixtures';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      currentMission: testMission,
      currentLevel: createTestLevel(),
    }),
}));

vi.mock('./ContextPanel', () => ({
  default: () => <div>context-panel</div>,
}));

vi.mock('./WorkArea', () => ({
  default: () => <div>work-area</div>,
}));

describe('GameLayout', () => {
  it('renders mission breadcrumb and panels', () => {
    render(
      <MemoryRouter initialEntries={['/missions/operation_ghost/assignments/ghost_recon_01']}>
        <Routes>
          <Route path="/missions/:missionId/assignments/:assignmentId" element={<GameLayout />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Operation Ghost' })).toHaveAttribute(
      'href',
      '/missions/operation_ghost/assignments'
    );
    expect(screen.getByRole('heading', { name: 'Find admin email' })).toBeInTheDocument();
    expect(screen.getByText('context-panel')).toBeInTheDocument();
    expect(screen.getByText('work-area')).toBeInTheDocument();
  });
});
