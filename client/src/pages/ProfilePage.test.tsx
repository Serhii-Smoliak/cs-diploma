import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProfilePage from './ProfilePage';

const mockUser = {
  id: 'u1',
  username: 'agent',
  email: 'agent@test.com',
  xp: 250,
  rank: 'Novice Hacker',
  stealth: 80,
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const { t, logout, updateUser, refreshUser, uploadAvatar } = vi.hoisted(() => ({
  t: (key: string, options?: { ns?: string }) => key,
  logout: vi.fn(),
  updateUser: vi.fn(),
  refreshUser: vi.fn().mockResolvedValue(undefined),
  uploadAvatar: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ user: mockUser, logout, updateUser, refreshUser }),
}));

vi.mock('../services/api', () => ({
  api: { uploadAvatar },
}));

vi.mock('../components/profile/UserAvatar', () => ({
  default: ({ username }: { username?: string }) => <span>{username}</span>,
}));

vi.mock('../components/profile/AvatarCropModal', () => ({
  default: ({
    isOpen,
    onSave,
    onClose,
  }: {
    isOpen: boolean;
    onSave: (image: string) => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <button type="button" onClick={() => onSave('data:image/jpeg;base64,crop')}>
          save-crop
        </button>
        <button type="button" onClick={onClose}>
          close-crop
        </button>
      </div>
    ) : null,
}));

describe('ProfilePage', () => {
  it('renders profile and logs out', async () => {
    const userEvents = userEvent.setup();

    render(<ProfilePage />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('title');

    await userEvents.click(screen.getByText('logout'));
    expect(logout).toHaveBeenCalled();
  });

  it('rejects invalid avatar file type', async () => {
    render(<ProfilePage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bad'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('invalidFileType')).toBeInTheDocument();
    });
  });

  it('uploads cropped avatar after valid file selection', async () => {
    const userEvents = userEvent.setup();
    uploadAvatar.mockResolvedValue({ ...mockUser, avatarUrl: '/uploads/avatars/u1.jpg' });

    render(<ProfilePage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['avatar'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'save-crop' })).toBeInTheDocument();
    });

    await userEvents.click(screen.getByRole('button', { name: 'save-crop' }));

    await waitFor(() => {
      expect(uploadAvatar).toHaveBeenCalledWith('data:image/jpeg;base64,crop');
      expect(updateUser).toHaveBeenCalled();
    });
  });
});
