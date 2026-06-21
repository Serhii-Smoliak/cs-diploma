import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LocaleSelectionModal from './LocaleSelectionModal';

describe('LocaleSelectionModal', () => {
  it('calls onSelect for chosen language', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<LocaleSelectionModal onSelect={onSelect} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /English/i }));

    expect(onSelect).toHaveBeenCalledWith('en');
  });
});
