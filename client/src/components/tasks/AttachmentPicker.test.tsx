import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AttachmentPicker from './AttachmentPicker';

describe('AttachmentPicker', () => {
  const attachments = [
    { id: 'a1', name: 'report.pdf', type: 'pdf', allowed: true },
    { id: 'a2', name: 'setup.exe', type: 'exe', allowed: false },
  ];

  it('renders attachments and toggles selection', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <AttachmentPicker
        attachments={attachments}
        selectedIds={['a1']}
        label="Attachments"
        onToggle={onToggle}
      />
    );

    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /setup.exe/i }));
    expect(onToggle).toHaveBeenCalledWith('a2');
  });
});
