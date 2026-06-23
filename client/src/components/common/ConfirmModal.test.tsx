import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
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

    expect(container).toBeEmptyDOMElement();
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
