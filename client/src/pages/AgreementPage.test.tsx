import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AgreementPage from './AgreementPage';

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: false }),
}));

describe('AgreementPage', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it('renders agreement sections and navigates back to login', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AgreementPage />
      </MemoryRouter>
    );

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('section1.title')).toBeInTheDocument();
    expect(screen.getByText('section5.body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'back' }));
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
