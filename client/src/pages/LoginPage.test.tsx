import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const { t, navigate, login, register } = vi.hoisted(() => ({
  t: (key: string) => key,
  navigate: vi.fn(),
  login: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ login, register }),
}));

vi.mock('../components/layout/Footer', () => ({
  default: () => <footer>footer</footer>,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    navigate.mockClear();
    login.mockClear();
    register.mockClear();
  });

  it('logs in with email and password', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'agent@test.com' } });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: 'secret12' },
    });
    await user.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('agent@test.com', 'secret12');
      expect(navigate).toHaveBeenCalledWith('/missions');
    });
  });

  it('requires agreement acceptance before register', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'switchToRegister' }));

    const textInputs = screen.getAllByRole('textbox');
    await user.type(textInputs[0]!, 'agent');
    await user.type(textInputs[1]!, 'agent@test.com');
    await user.type(document.querySelector('input[type="password"]')!, 'secret12');

    expect(screen.getByText('register')).toHaveAttribute('disabled');
    expect(register).not.toHaveBeenCalled();
  });

  it('shows error when register fails', async () => {
    register.mockRejectedValueOnce(new Error('Email taken'));
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'switchToRegister' }));
    const [usernameInput, emailInput, passwordInput] = document.querySelectorAll('form input');
    fireEvent.change(usernameInput!, { target: { value: 'agent' } });
    fireEvent.change(emailInput!, { target: { value: 'agent@test.com' } });
    fireEvent.change(passwordInput!, { target: { value: 'secret12' } });
    await user.click(screen.getByRole('checkbox'));
    fireEvent.submit(document.querySelector('form')!);

    expect(await screen.findByText('Email taken')).toBeInTheDocument();
  });
});
