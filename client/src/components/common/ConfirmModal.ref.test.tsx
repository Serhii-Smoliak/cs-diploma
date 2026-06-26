import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const nullDialogRef: { current: HTMLDialogElement | null } = {};
Object.defineProperty(nullDialogRef, 'current', {
  get: () => null,
  set: () => undefined,
});

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();

  return {
    ...actual,
    useRef: (initialValue: unknown) => {
      if (initialValue === null) {
        return nullDialogRef;
      }

      return actual.useRef(initialValue);
    },
  };
});

import ConfirmModal from './ConfirmModal';

describe('ConfirmModal ref guard', () => {
  it('skips dialog effects when ref is unavailable', () => {
    expect(() =>
      render(
        <ConfirmModal
          isOpen
          titleId="test-title"
          title="Title"
          cancelLabel="Cancel"
          confirmLabel="Confirm"
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      )
    ).not.toThrow();
  });
});
