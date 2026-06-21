import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContextPanel from './ContextPanel';
import { createTestLevel, phishingLevel, tacticalLevel } from '../../test/fixtures';

const gameState = vi.hoisted(() => ({
  currentLevel: null as ReturnType<typeof createTestLevel> | null,
  levelProgress: null as { completed: boolean; lastAnswer: string | null } | null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { answer?: string }) =>
      key === 'handlerTaskCompleted' ? `Completed: ${options?.answer ?? ''}` : key,
  }),
}));

vi.mock('@/store/gameStore.ts', () => ({
  useGameStore: (selector: (state: typeof gameState) => unknown) => selector(gameState),
}));

vi.mock('../mitre/MitreTechniqueBadge', () => ({
  default: ({ technique }: { technique: { id: string } }) => <span>badge-{technique.id}</span>,
}));

describe('ContextPanel', () => {
  it('renders mitre badge and incomplete system message', () => {
    gameState.currentLevel = createTestLevel();
    gameState.levelProgress = { completed: false, lastAnswer: null };

    render(<ContextPanel />);

    expect(screen.getByText('badge-T1593')).toBeInTheDocument();
    expect(screen.getByText('taskStatusNotCompleted')).toBeInTheDocument();
  });

  it('formats tactical choice answer when completed', () => {
    gameState.currentLevel = tacticalLevel;
    gameState.levelProgress = { completed: true, lastAnswer: 'choice_1' };

    render(<ContextPanel />);

    expect(screen.getByText(/Use phishing domain A/)).toBeInTheDocument();
  });

  it('formats phishing answer json when completed', () => {
    gameState.currentLevel = phishingLevel;
    gameState.levelProgress = {
      completed: true,
      lastAnswer: JSON.stringify({
        to: 'admin@target.test',
        subject: 'Urgent',
        body: 'Review',
        attachments: ['att1'],
      }),
    };

    render(<ContextPanel />);

    expect(screen.getByText(/Urgent/)).toBeInTheDocument();
    expect(screen.getByText(/report\.pdf/)).toBeInTheDocument();
  });
});
