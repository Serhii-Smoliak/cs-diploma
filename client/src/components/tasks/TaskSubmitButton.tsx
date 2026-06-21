import type { MouseEvent, ReactNode } from 'react';

interface TaskSubmitButtonProps {
  disabled?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

export default function TaskSubmitButton({ disabled = false, onClick, children }: TaskSubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      disabled={disabled}
      className="inline-flex items-center justify-center cyber-button-success px-6 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
    >
      {children}
    </button>
  );
}
