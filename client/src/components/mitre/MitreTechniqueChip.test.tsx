import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MitreTechniqueChip from './MitreTechniqueChip';

describe('MitreTechniqueChip', () => {
  it('renders internal skill matrix link in a new tab', () => {
    render(<MitreTechniqueChip techniqueId="T1593" title="Recon" />);

    const link = screen.getByRole('link', { name: 'T1593' });
    expect(link).toHaveAttribute('href', '/skill-matrix?technique=T1593');
    expect(link).toHaveAttribute('title', 'Recon');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders external indicator and opens MITRE ATT&CK in new tab', () => {
    render(<MitreTechniqueChip techniqueId="T1087.002" title="Recon" external />);

    const link = screen.getByRole('link', { name: 'T1087.002' });
    expect(link).toHaveAttribute('href', 'https://attack.mitre.org/techniques/T1087/002/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
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
