import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ContextPanel from './ContextPanel';
import { createTestLevel, phishingLevel, sentenceLevel, tacticalLevel } from '../../test/fixtures';

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

  it('formats sentence constructor answer when completed', () => {
    gameState.currentLevel = sentenceLevel;
    gameState.levelProgress = {
      completed: true,
      lastAnswer: JSON.stringify({
        fields: { cmd: ['t1'] },
        attachments: ['lnk1'],
      }),
    };

    render(<ContextPanel />);

    expect(screen.getByText(/part_a/)).toBeInTheDocument();
    expect(screen.getByText(/invoice\.lnk/)).toBeInTheDocument();
  });

  it('formats code editor answer when completed', () => {
    gameState.currentLevel = createTestLevel({ task_type: 'code_editor' });
    gameState.levelProgress = { completed: true, lastAnswer: '.*@.*' };

    render(<ContextPanel />);

    expect(screen.getByText('Completed:')).toBeInTheDocument();
    expect(screen.getByText('.*@.*')).toBeInTheDocument();
  });

  it('inserts handler completion after last handler message', () => {
    gameState.currentLevel = createTestLevel({
      dialogue: [
        { speaker: 'system', text: 'Briefing' },
        { speaker: 'handler', text: 'Start task' },
      ],
    });
    gameState.levelProgress = { completed: true, lastAnswer: '.*@.*' };

    render(<ContextPanel />);

    expect(screen.getByText(/Completed:/)).toBeInTheDocument();
    expect(screen.getByText('Start task')).toBeInTheDocument();
  });

  it('inserts not completed message after leading system messages', () => {
    gameState.currentLevel = createTestLevel({
      dialogue: [
        { speaker: 'system', text: 'Intro' },
        { speaker: 'handler', text: 'Go' },
      ],
    });
    gameState.levelProgress = { completed: false, lastAnswer: null };

    render(<ContextPanel />);

    expect(screen.getByText('taskStatusNotCompleted')).toBeInTheDocument();
  });
});
