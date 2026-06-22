import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MitreTechniqueChip from './MitreTechniqueChip';

describe('MitreTechniqueChip', () => {
  it('renders external skill matrix link', () => {
    render(<MitreTechniqueChip techniqueId="T1593" title="Recon" />);

    const link = screen.getByRole('link', { name: 'T1593' });
    expect(link).toHaveAttribute('href', '/skill-matrix?technique=T1593');
    expect(link).toHaveAttribute('title', 'Recon');
  });

  it('stops click propagation on the chip link', () => {
    const parentClick = vi.fn();

    render(
      <div onClick={parentClick}>
        <MitreTechniqueChip techniqueId="T1593" />
      </div>
    );

    fireEvent.click(screen.getByRole('link', { name: 'T1593' }));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
