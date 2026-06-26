import type { ReactNode } from 'react';

export type ConfirmModalVariant = 'primary' | 'danger';

const variantStyles: Record<
  ConfirmModalVariant,
  { panel: string; title: string; confirm: string }
> = {
  primary: {
    panel: 'border-cyber-primary',
    title: 'text-cyber-primary',
    confirm:
      'border-cyber-primary bg-cyber-primary/10 text-cyber-primary hover:bg-cyber-primary/20',
  },
  danger: {
    panel: 'border-red-500/60',
    title: 'text-red-400',
    confirm: 'border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20',
  },
};

export interface ConfirmModalProps {
  isOpen: boolean;
  titleId: string;
  title: string;
  message?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  loadingLabel?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  variant?: ConfirmModalVariant;
  children?: ReactNode;
}

export default function ConfirmModal({
  isOpen,
  titleId,
  title,
  message,
  cancelLabel,
  confirmLabel,
  loadingLabel,
  isLoading = false,
  onCancel,
  onConfirm,
  variant = 'primary',
  children,
}: Readonly<ConfirmModalProps>) {
  if (!isOpen) {
    return null;
  }

  const styles = variantStyles[variant];

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onCancel}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`cyber-panel border-2 ${styles.panel} p-6 max-w-md w-full pointer-events-auto max-h-[calc(100vh-2rem)] overflow-y-auto`}
        >
          <h2 id={titleId} className={`font-heading font-bold text-xl mb-3 ${styles.title}`}>
            {title}
          </h2>
          {message && <p className="text-gray-400 text-sm mb-4 leading-relaxed">{message}</p>}
          {children}
          <div className={`grid grid-cols-2 gap-3 ${children ? 'mt-4' : 'pt-1'}`}>
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="w-full px-3 py-2.5 rounded border border-cyber-border bg-cyber-panel/60 text-sm text-gray-300 hover:border-cyber-primary hover:text-cyber-primary transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
              className={`w-full px-3 py-2.5 rounded border text-sm transition-colors disabled:opacity-50 ${styles.confirm}`}
            >
              {isLoading && loadingLabel ? loadingLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
