export function syncConfirmDialogOpenState(
  dialog: HTMLDialogElement | null,
  isOpen: boolean,
  closingProgrammaticallyRef: { current: boolean }
): void {
  if (!dialog) {
    return;
  }

  if (isOpen) {
    if (!dialog.open) {
      dialog.showModal();
    }
    return;
  }

  if (dialog.open) {
    closingProgrammaticallyRef.current = true;
    dialog.close();
    closingProgrammaticallyRef.current = false;
  }
}

export function bindConfirmDialogDismissHandlers(
  dialog: HTMLDialogElement | null,
  isLoading: boolean,
  closingProgrammaticallyRef: { current: boolean },
  onCancel: () => void
): () => void {
  if (!dialog) {
    return () => undefined;
  }

  const handleClose = () => {
    if (closingProgrammaticallyRef.current || isLoading) {
      return;
    }
    onCancel();
  };

  const handleCancel = (event: Event) => {
    event.preventDefault();
    if (!isLoading) {
      onCancel();
    }
  };

  dialog.addEventListener('close', handleClose);
  dialog.addEventListener('cancel', handleCancel);

  return () => {
    dialog.removeEventListener('close', handleClose);
    dialog.removeEventListener('cancel', handleCancel);
  };
}
