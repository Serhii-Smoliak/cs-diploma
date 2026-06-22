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

  it('refreshLevelProgress loads progress from api', async () => {
    getUserProgress.mockResolvedValue([
      { levelId: 'ghost_recon_01', completed: true, lastAnswer: 'answer' },
    ]);
    useGameStore.setState({ currentLevel: createTestLevel() });

    await useGameStore.getState().refreshLevelProgress();

    expect(useGameStore.getState().levelProgress).toEqual({
      completed: true,
      lastAnswer: 'answer',
    });
  });

  it('refreshLevelProgress clears progress without level', async () => {
    await useGameStore.getState().refreshLevelProgress();
    expect(useGameStore.getState().levelProgress).toBeNull();
  });

  it('loadLevel fetches levels when cache is empty', async () => {
    getMissionLevels.mockResolvedValue([createTestLevel()]);
    useGameStore.setState({ currentMission: testMission, levels: [] });

    await useGameStore.getState().loadLevel('ghost_recon_01');

    expect(useGameStore.getState().currentLevel?.level_id).toBe('ghost_recon_01');
  });

  it('loadLevel searches all missions when level missing locally', async () => {
    getMissions.mockResolvedValue([testMission]);
    getMissionLevels.mockResolvedValue([createTestLevel()]);

    await useGameStore.getState().loadLevel('ghost_recon_01');

    expect(useGameStore.getState().currentMission?.id).toBe(testMission.id);
    expect(useGameStore.getState().currentLevel?.level_id).toBe('ghost_recon_01');
  });

  it('submitAnswer updates stealth and xp on success', async () => {
    authState.updateUser = vi.fn();
    useGameStore.setState({ currentLevel: createTestLevel() });
    submitAnswer.mockResolvedValue({
      success: true,
      message: 'OK',
      xpGained: 25,
      stealth: 70,
    });

    const result = await useGameStore.getState().submitAnswer('.*');

    expect(result?.success).toBe(true);
    expect(authState.updateUser).toHaveBeenCalledWith({ stealth: 70 });
    expect(authState.updateUser).toHaveBeenCalledWith({ xp: 125 });
  });

  it('submitAnswer opens stealth modal when server reports depletion', async () => {
    useGameStore.setState({ currentLevel: createTestLevel() });
    submitAnswer.mockResolvedValue({
      success: false,
      message: 'Low stealth',
      stealthDepleted: true,
    });

    await useGameStore.getState().submitAnswer('bad');

    expect(useGameStore.getState().stealthModalOpen).toBe(true);
  });

  it('submitAnswer throws when no level selected', async () => {
    await expect(useGameStore.getState().submitAnswer('x')).rejects.toThrow('No level selected');
  });

  it('setMission stores error when api fails', async () => {
    getMissionLevels.mockRejectedValue(new Error('network'));

    await useGameStore.getState().setMission(testMission);

    expect(useGameStore.getState().error).toBe('network');
  });
});
