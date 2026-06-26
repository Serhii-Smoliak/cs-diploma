import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AdminAsyncState,
  AdminDangerConfirmModal,
  AdminDetailSection,
  AdminErrorPanel,
  AdminListSection,
  AdminLoadingPanel,
  AdminPageShell,
  AdminTwoColumnGrid,
} from './adminPageUi';

const t = vi.fn((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key);

describe('adminPageUi', () => {
  it('renders loading, error and list section panels', () => {
    render(
      <>
        <AdminLoadingPanel label="Loading..." />
        <AdminErrorPanel message="Failed" />
        <AdminListSection title="Items">
          <p>List body</p>
        </AdminListSection>
      </>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Items' })).toBeInTheDocument();
    expect(screen.getByText('List body')).toBeInTheDocument();
  });

  it('renders page shell with optional header action', () => {
    render(
      <AdminPageShell title="Admin" headerAction={<button type="button">Create</button>}>
        <p>Body</p>
      </AdminPageShell>
    );

    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders two-column grid and detail section', () => {
    render(
      <AdminTwoColumnGrid>
        <AdminDetailSection>
          <p>Detail panel</p>
        </AdminDetailSection>
      </AdminTwoColumnGrid>
    );

    expect(screen.getByText('Detail panel')).toBeInTheDocument();
  });

  it('renders async state branches', () => {
    const { rerender } = render(
      <AdminAsyncState loading loadingLabel="Loading..." error={null}>
        <p>Content</p>
      </AdminAsyncState>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(
      <AdminAsyncState loading={false} loadingLabel="Loading..." error="Failed">
        <p>Content</p>
      </AdminAsyncState>
    );

    expect(screen.getByText('Failed')).toBeInTheDocument();

    rerender(
      <AdminAsyncState loading={false} loadingLabel="Loading..." error={null}>
        <p>Content</p>
      </AdminAsyncState>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders danger confirm modal', () => {
    render(
      <AdminDangerConfirmModal
        isOpen
        titleId="delete-title"
        title="Delete?"
        message="Are you sure?"
        isLoading={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        t={t}
        isEn
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
