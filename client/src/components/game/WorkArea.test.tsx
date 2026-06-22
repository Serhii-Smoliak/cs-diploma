import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WorkArea from './WorkArea';
import { createTestLevel, phishingLevel, sentenceLevel, tacticalLevel } from '../../test/fixtures';

const gameState = vi.hoisted(() => ({
  currentLevel: null as ReturnType<typeof createTestLevel> | null,
  levelProgress: { completed: true, lastAnswer: 'choice_1' } as {
    completed: boolean;
    lastAnswer: string | null;
  } | null,
  retryMode: false,
  loadLevel: vi.fn().mockResolvedValue(undefined),
  setRetryMode: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      currentLevel: gameState.currentLevel,
      levels: [tacticalLevel, createTestLevel({ level_id: 'ghost_02', order: 2 })],
      levelProgress: gameState.levelProgress,
      retryMode: gameState.retryMode,
      loadLevel: gameState.loadLevel,
      setRetryMode: gameState.setRetryMode,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../tasks/TacticalChoice', () => ({
  default: () => <div>tactical-task</div>,
}));

vi.mock('../tasks/CodeEditor', () => ({
  default: () => <div>code-task</div>,
}));

vi.mock('../tasks/PhishingConstructor', () => ({
  default: () => <div>phishing-task</div>,
}));

vi.mock('../tasks/SentenceConstructor', () => ({
  default: () => <div>sentence-task</div>,
}));

function renderWorkArea(initialEntry = '/missions/operation_ghost/assignments/ghost_choice_01') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/missions/:missionId/assignments/:assignmentId" element={<WorkArea />} />
        <Route path="/missions/:missionId/assignments" element={<WorkArea />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('WorkArea', () => {
  it('shows completed state with retry action', async () => {
    const user = userEvent.setup();
    gameState.currentLevel = tacticalLevel;
    gameState.levelProgress = { completed: true, lastAnswer: 'choice_1' };
    gameState.retryMode = false;

    renderWorkArea();

    expect(screen.getByText('levelCompletedTitle')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'tryAgain' }));
    expect(gameState.setRetryMode).toHaveBeenCalledWith(true);
  });

  it('renders tactical task in retry mode', () => {
    gameState.currentLevel = tacticalLevel;
    gameState.levelProgress = { completed: true, lastAnswer: 'choice_1' };
    gameState.retryMode = true;

    renderWorkArea('/missions/operation_ghost/assignments/ghost_choice_01');
    expect(screen.getByText('tactical-task')).toBeInTheDocument();
  });

  it('shows empty state without current level', () => {
    gameState.currentLevel = null;
    gameState.levelProgress = null;

    renderWorkArea('/missions/operation_ghost/assignments');
    expect(screen.getByText('selectMission')).toBeInTheDocument();
  });

  it('renders code editor task while in progress', () => {
    gameState.currentLevel = createTestLevel({ task_type: 'code_editor' });
    gameState.levelProgress = { completed: false, lastAnswer: null };
    gameState.retryMode = false;

    renderWorkArea();
    expect(screen.getByText('code-task')).toBeInTheDocument();
  });

  it('renders phishing and sentence tasks while in progress', () => {
    gameState.currentLevel = phishingLevel;
    gameState.levelProgress = { completed: false, lastAnswer: null };
    gameState.retryMode = false;
    renderWorkArea('/missions/operation_ghost/assignments/ghost_phish_01');
    expect(screen.getByText('phishing-task')).toBeInTheDocument();

    gameState.currentLevel = sentenceLevel;
    renderWorkArea('/missions/operation_ghost/assignments/ghost_sentence_01');
    expect(screen.getByText('sentence-task')).toBeInTheDocument();
  });

  it('loads next assignment from completed state', async () => {
    const user = userEvent.setup();
    gameState.currentLevel = tacticalLevel;
    gameState.levelProgress = { completed: true, lastAnswer: 'choice_1' };
    gameState.retryMode = false;

    renderWorkArea('/missions/operation_ghost/assignments/ghost_choice_01');
    await user.click(screen.getByRole('button', { name: 'nextAssignment' }));

    expect(gameState.loadLevel).toHaveBeenCalledWith('ghost_02');
  });

  it('shows back to missions when mission is finished', async () => {
    const user = userEvent.setup();
    gameState.currentLevel = createTestLevel({ level_id: 'ghost_02', order: 2 });
    gameState.levelProgress = { completed: true, lastAnswer: 'x' };
    gameState.retryMode = false;

    renderWorkArea('/missions/operation_ghost/assignments/ghost_02');
    expect(screen.getByText('allMissionTasksCompleted')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'backToMissions' }));
  });

  it('shows unknown task fallback', () => {
    gameState.currentLevel = createTestLevel({
      level_id: 'ghost_unknown',
      task_type: 'unknown' as 'code_editor',
    });
    gameState.levelProgress = { completed: false, lastAnswer: null };
    gameState.retryMode = false;

    renderWorkArea('/missions/operation_ghost/assignments/ghost_unknown');
    expect(screen.getByText('unknownTask')).toBeInTheDocument();
  });
});
