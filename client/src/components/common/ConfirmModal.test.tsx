import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('closes dialog when isOpen becomes false without calling onCancel', () => {
    const onCancel = vi.fn();

    const { rerender } = render(
      <ConfirmModal
        isOpen
        titleId="test-title"
        title="Title"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).toHaveAttribute('open');

    rerender(
      <ConfirmModal
        isOpen={false}
        titleId="test-title"
        title="Title"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    expect(dialog).not.toHaveAttribute('open');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('skips showModal when dialog is already open', () => {
    const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');

    const props = {
      isOpen: false,
      titleId: 'test-title',
      title: 'Title',
      cancelLabel: 'Cancel',
      confirmLabel: 'Confirm',
      onCancel: vi.fn(),
      onConfirm: vi.fn(),
    };

    const { rerender } = render(<ConfirmModal {...props} />);
    screen.getByRole('dialog', { hidden: true }).showModal();
    expect(showModalSpy).toHaveBeenCalledTimes(1);

    rerender(<ConfirmModal {...props} isOpen />);
    expect(showModalSpy).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when dialog closes externally', () => {
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen
        titleId="test-title"
        title="Title"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    screen.getByRole('dialog').close();

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel on native cancel event when not loading', () => {
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen
        titleId="test-title"
        title="Title"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores native cancel and close events while loading', () => {
    const onCancel = vi.fn();

    render(
      <ConfirmModal
        isOpen
        titleId="test-title"
        title="Title"
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        isLoading
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    dialog.close();

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('renders danger variant, children, and loading label', () => {
    render(
      <ConfirmModal
        isOpen
        variant="danger"
        titleId="danger-title"
        title="Delete item?"
        cancelLabel="Cancel"
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        isLoading
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      >
        <p>Extra warning</p>
      </ConfirmModal>
    );

    expect(screen.getByText('Delete item?')).toHaveClass('text-red-400');
    expect(screen.getByText('Extra warning')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});
