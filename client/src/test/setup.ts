import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

vi.mock('framer-motion', () => {
  const motionComponent =
    (tag: keyof JSX.IntrinsicElements) =>
    ({ children, whileHover, whileTap, initial, animate, transition, exit, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement(tag, props, children);

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => motionComponent(prop as keyof JSX.IntrinsicElements),
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
  };
});

vi.mock('@monaco-editor/react', () => ({
  default: ({
    onChange,
    value,
  }: {
    onChange?: (value: string) => void;
    value?: string;
  }) =>
    React.createElement('textarea', {
      'data-testid': 'monaco-editor',
      value: value ?? '',
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value),
    }),
}));

function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return store[key] ?? null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageMock());
  vi.stubGlobal('location', { assign: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
