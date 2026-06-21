import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { describe, expect, it, vi } from 'vitest';
import type { SubmitAnswerResponse } from '@cybertactics/shared';

const loadLevel = vi.fn();
const levels = [{ level_id: 'level_1' }, { level_id: 'level_2' }];
const currentLevel = { level_id: 'level_1' };

vi.mock('../../store/gameStore', () => ({
  useGameStore: () => ({
    loadLevel,
    levels,
    currentLevel,
  }),
}));

import { preventTaskMouseDefault, useTaskProgress } from './useTaskProgress';

describe('preventTaskMouseDefault', () => {
  it('prevents default and stops propagation when event is provided', () => {
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    preventTaskMouseDefault(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});

describe('useTaskProgress', () => {
  const t = ((key: string) => key) as TFunction;

  it('handles successful submit response', () => {
    const { result } = renderHook(() => useTaskProgress());
    const onSuccess = vi.fn();
    const response: SubmitAnswerResponse = {
      success: true,
      message: 'Great job',
      xpGained: 50,
      nextLevelId: 'level_2',
    };

    act(() => {
      result.current.applySubmitResponse(response, t, onSuccess);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(result.current.xpGained).toBe(50);
    expect(result.current.nextLevelId).toBe('level_2');
    expect(result.current.result).toContain('success');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('handles failed submit response', () => {
    const { result } = renderHook(() => useTaskProgress());

    act(() => {
      result.current.applySubmitResponse({ success: false, message: 'Wrong' }, t);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.result).toContain('failure');
  });

  it('handles submit errors', () => {
    const { result } = renderHook(() => useTaskProgress());

    act(() => {
      result.current.applySubmitError(new Error('Network down'), t);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.result).toContain('Network down');
  });

  it('detects next level and navigates', () => {
    const { result } = renderHook(() => useTaskProgress());

    act(() => {
      result.current.setNextLevelId('level_2');
    });

    expect(result.current.hasNextLevel()).toBe(true);

    act(() => {
      result.current.goToNextLevel();
    });

    expect(loadLevel).toHaveBeenCalledWith('level_2');
    expect(result.current.nextLevelId).toBeNull();
  });

  it('resets progress state', () => {
    const { result } = renderHook(() => useTaskProgress());

    act(() => {
      result.current.setIsSuccess(true);
      result.current.setResult('done');
      result.current.setXpGained(10);
      result.current.setNextLevelId('level_2');
      result.current.resetProgress();
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.xpGained).toBeNull();
    expect(result.current.nextLevelId).toBeNull();
  });
});
