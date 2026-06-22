import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UserAvatar from './UserAvatar';

vi.mock('../../services/api', () => ({
  resolveAssetUrl: (url: string | null | undefined) => (url ? `http://localhost:4000${url}` : null),
}));

describe('UserAvatar', () => {
  it('renders initial when avatar is missing', () => {
    render(<UserAvatar username="agent" size="md" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders image when avatar url exists', () => {
    render(<UserAvatar username="agent" avatarUrl="/uploads/avatars/u1.jpg" />);
    expect(screen.getByRole('img', { name: 'agent' })).toHaveAttribute(
      'src',
      'http://localhost:4000/uploads/avatars/u1.jpg'
    );
  });
});
