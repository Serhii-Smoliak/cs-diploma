import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestLevel, testMission } from '../test/fixtures';

const authState = vi.hoisted(() => ({
  user: { id: 'u1', xp: 100, stealth: 80 } as { id: string; xp: number; stealth: number },
  updateUser: vi.fn(),
  refreshUser: vi.fn().mockResolvedValue(undefined),
}));

const { getMissionLevels, getMissions, submitAnswer, getUserProgress } = vi.hoisted(() => ({
  getMissionLevels: vi.fn(),
  getMissions: vi.fn(),
  submitAnswer: vi.fn(),
  getUserProgress: vi.fn(),
}));

vi.mock('../services/api', () => ({
  api: {
    getMissionLevels,
    getMissions,
    submitAnswer,
    getUserProgress,
  },
}));

vi.mock('./authStore', () => ({
  useAuthStore: {
    getState: () => authState,
  },
}));

import { useGameStore } from './gameStore';

describe('useGameStore extended', () => {
  beforeEach(() => {
    authState.user = { id: 'u1', xp: 100, stealth: 80 };
    getMissionLevels.mockReset();
    getMissions.mockReset();
    submitAnswer.mockReset();
    getUserProgress.mockReset();
    getUserProgress.mockResolvedValue([]);
    useGameStore.getState().reset();
  });

  it('loads level from mission cache', async () => {
    const level = createTestLevel();
    useGameStore.setState({
      currentMission: testMission,
      levels: [level],
    });

    await useGameStore.getState().loadLevel(level.level_id);

    expect(useGameStore.getState().currentLevel?.level_id).toBe(level.level_id);
  });

  it('submits answer and marks level completed', async () => {
    useGameStore.setState({ currentLevel: createTestLevel() });
    submitAnswer.mockResolvedValue({
      success: true,
      message: 'OK',
      xpGained: 50,
      stealth: 75,
    });

    const result = await useGameStore.getState().submitAnswer('.*@.*');

    expect(result?.success).toBe(true);
    expect(useGameStore.getState().levelProgress?.completed).toBe(true);
  });

  it('opens stealth modal when stealth is depleted', async () => {
    authState.user = { id: 'u1', xp: 0, stealth: 0 };
    useGameStore.setState({ currentLevel: createTestLevel() });

    const result = await useGameStore.getState().submitAnswer('x');

    expect(result?.stealthDepleted).toBe(true);
    expect(useGameStore.getState().stealthModalOpen).toBe(true);
  });

  it('loads mission levels via setMission', async () => {
    getMissionLevels.mockResolvedValue([createTestLevel()]);

    await useGameStore.getState().setMission(testMission);

    expect(useGameStore.getState().levels).toHaveLength(1);
    expect(useGameStore.getState().currentMission).toEqual(testMission);
  });

  it('toggles stealth modal and retry mode', () => {
    useGameStore.getState().openStealthModal();
    expect(useGameStore.getState().stealthModalOpen).toBe(true);

    useGameStore.getState().closeStealthModal();
    expect(useGameStore.getState().stealthModalOpen).toBe(false);

    useGameStore.getState().setRetryMode(true);
    expect(useGameStore.getState().retryMode).toBe(true);
  });
});
