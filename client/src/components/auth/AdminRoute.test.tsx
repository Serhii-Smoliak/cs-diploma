import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AdminRoute from './AdminRoute';

const authState = vi.hoisted(() => ({
  user: { role: 'USER' as 'USER' | 'ADMIN' },
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (state: typeof authState) => unknown) => {
    const state = { user: authState.user };
    return selector ? selector(state) : state;
  },
}));

describe('AdminRoute', () => {
  it('renders children for admin users', () => {
    authState.user = { role: 'ADMIN' };

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>admin-content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('admin-content')).toBeInTheDocument();
  });

  it('redirects non-admin users to missions', () => {
    authState.user = { role: 'USER' };

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AdminRoute>
          <div>admin-content</div>
        </AdminRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('admin-content')).not.toBeInTheDocument();
  });
});
