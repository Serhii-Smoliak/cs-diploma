import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  it('keeps dialog closed when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        titleId="test-title"
        title="Title"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open');
  });

  it('opens native dialog when isOpen is true', () => {
    render(
      <ConfirmModal
        isOpen
        titleId="test-title"
        title="Sync MITRE?"
        message="Continue?"
        cancelLabel="Cancel"
        confirmLabel="Yes"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('open');
    expect(screen.getByText('Sync MITRE?')).toBeInTheDocument();
  });

  it('calls handlers from action buttons', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen
        titleId="test-title"
        title="Sync MITRE?"
        message="Continue?"
        cancelLabel="Cancel"
        confirmLabel="Yes"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
