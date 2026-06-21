import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MitreTechniqueChip from './MitreTechniqueChip';

describe('MitreTechniqueChip', () => {
  it('renders external skill matrix link', () => {
    render(<MitreTechniqueChip techniqueId="T1593" title="Recon" />);

    const link = screen.getByRole('link', { name: 'T1593' });
    expect(link).toHaveAttribute('href', '/skill-matrix?technique=T1593');
    expect(link).toHaveAttribute('title', 'Recon');
  });
});
