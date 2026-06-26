import type { TFunction } from 'i18next';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  AdminAsyncState,
  AdminConfirmModal,
  AdminDangerConfirmModal,
  AdminDetailPlaceholder,
  AdminEmptyListNotice,
  AdminErrorPanel,
  AdminListSection,
  AdminLoadingPanel,
  AdminMasterDetailLayout,
  AdminPageShell,
  AdminScrollableList,
  AdminTwoColumnGrid,
} from './adminPageUi';

const t = ((key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key) as TFunction;

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

  it('renders master detail layout with list and detail panes', () => {
    render(
      <AdminMasterDetailLayout
        loading={false}
        error={null}
        loadingLabel="Loading..."
        listTitle="All items"
        list={<p>List content</p>}
        detail={<AdminDetailPlaceholder message="Pick one" />}
      />
    );

    expect(screen.getByRole('heading', { name: 'All items' })).toBeInTheDocument();
    expect(screen.getByText('List content')).toBeInTheDocument();
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('renders empty list notice and scrollable list', () => {
    render(
      <>
        <AdminEmptyListNotice message="Empty" />
        <AdminScrollableList>
          <p>Row</p>
        </AdminScrollableList>
      </>
    );

    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('Row')).toBeInTheDocument();
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

  it('renders two-column grid wrapper', () => {
    render(
      <AdminTwoColumnGrid>
        <AdminDetailPlaceholder message="Detail" />
      </AdminTwoColumnGrid>
    );

    expect(screen.getByText('Detail')).toBeInTheDocument();
  });

  it('renders confirm modal with cancel label', () => {
    render(
      <AdminConfirmModal
        isOpen
        titleId="confirm-title"
        title="Confirm?"
        message="Sure?"
        confirmLabel="OK"
        loadingLabel="Working..."
        isLoading={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        t={t}
        isEn
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
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
