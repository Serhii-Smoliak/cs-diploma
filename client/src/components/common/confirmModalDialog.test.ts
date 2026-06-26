import { describe, expect, it, vi } from 'vitest';
import { bindConfirmDialogDismissHandlers, syncConfirmDialogOpenState } from './confirmModalDialog';

function createDialog(): HTMLDialogElement {
  return document.createElement('dialog');
}

describe('confirmModalDialog', () => {
  describe('syncConfirmDialogOpenState', () => {
    it('returns when dialog ref is missing', () => {
      const closingRef = { current: false };
      expect(() => syncConfirmDialogOpenState(null, true, closingRef)).not.toThrow();
    });

    it('opens dialog when isOpen is true', () => {
      const dialog = createDialog();
      const closingRef = { current: false };

      syncConfirmDialogOpenState(dialog, true, closingRef);

      expect(dialog.open).toBe(true);
    });

    it('skips showModal when dialog is already open', () => {
      const dialog = createDialog();
      const closingRef = { current: false };
      const showModalSpy = vi.spyOn(dialog, 'showModal');

      dialog.showModal();
      syncConfirmDialogOpenState(dialog, true, closingRef);

      expect(showModalSpy).toHaveBeenCalledTimes(1);
    });

    it('closes dialog programmatically when isOpen becomes false', () => {
      const dialog = createDialog();
      const closingRef = { current: false };
      const onCancel = vi.fn();

      dialog.showModal();
      const unbind = bindConfirmDialogDismissHandlers(dialog, false, closingRef, onCancel);

      syncConfirmDialogOpenState(dialog, false, closingRef);

      expect(dialog.open).toBe(false);
      expect(onCancel).not.toHaveBeenCalled();

      unbind();
    });
  });

  describe('bindConfirmDialogDismissHandlers', () => {
    it('returns noop cleanup when dialog ref is missing', () => {
      const cleanup = bindConfirmDialogDismissHandlers(null, false, { current: false }, vi.fn());
      expect(cleanup).not.toThrow();
    });

    it('calls onCancel on external close', () => {
      const dialog = createDialog();
      const closingRef = { current: false };
      const onCancel = vi.fn();

      dialog.showModal();
      bindConfirmDialogDismissHandlers(dialog, false, closingRef, onCancel);
      dialog.close();

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel on cancel event when not loading', () => {
      const dialog = createDialog();
      const onCancel = vi.fn();

      dialog.showModal();
      bindConfirmDialogDismissHandlers(dialog, false, { current: false }, onCancel);
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('ignores close and cancel events while loading', () => {
      const dialog = createDialog();
      const onCancel = vi.fn();

      dialog.showModal();
      bindConfirmDialogDismissHandlers(dialog, true, { current: false }, onCancel);
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
      dialog.close();

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('removes listeners on cleanup', () => {
      const dialog = createDialog();
      const onCancel = vi.fn();

      dialog.showModal();
      const unbind = bindConfirmDialogDismissHandlers(dialog, false, { current: false }, onCancel);
      unbind();
      dialog.close();

      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
