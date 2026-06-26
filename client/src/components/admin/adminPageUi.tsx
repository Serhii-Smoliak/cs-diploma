import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import ConfirmModal, { type ConfirmModalProps } from '../common/ConfirmModal';
import { adminCancelLabel, adminDeleteLabels } from './adminPageUiHelpers';

export function AdminLoadingPanel({ label }: Readonly<{ label: string }>) {
  return <div className="cyber-panel p-6 text-center text-gray-400 text-sm">{label}</div>;
}

export function AdminErrorPanel({ message }: Readonly<{ message: string }>) {
  return (
    <div className="cyber-panel p-4 border border-red-500/40 text-red-400 text-sm">{message}</div>
  );
}

export function AdminListSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <section className="cyber-panel border border-cyber-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-cyber-border bg-cyber-panel/80">
        <h2 className="font-heading text-lg text-cyber-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function AdminPageShell({
  title,
  children,
  headerAction,
}: Readonly<{
  title: string;
  children: ReactNode;
  headerAction?: ReactNode;
}>) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className={headerAction ? 'flex items-center justify-between gap-4' : undefined}>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-cyber-primary">
            {title}
          </h1>
          {headerAction}
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminAsyncState({
  loading,
  error,
  loadingLabel,
  children,
}: Readonly<{
  loading: boolean;
  error: string | null;
  loadingLabel: string;
  children: ReactNode;
}>) {
  if (loading) {
    return <AdminLoadingPanel label={loadingLabel} />;
  }

  if (error) {
    return <AdminErrorPanel message={error} />;
  }

  return <>{children}</>;
}

export function AdminTwoColumnGrid({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{children}</div>;
}

export function AdminDetailSection({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section className="cyber-panel border border-cyber-border rounded-lg p-4 sm:p-6 min-h-[20rem]">
      {children}
    </section>
  );
}

export function AdminEmptyListNotice({ message }: Readonly<{ message: string }>) {
  return <div className="p-6 text-center text-gray-400 text-sm">{message}</div>;
}

export function AdminScrollableList({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="divide-y divide-cyber-border/60 max-h-[32rem] overflow-y-auto">{children}</div>
  );
}

export function AdminDetailPlaceholder({ message }: Readonly<{ message: string }>) {
  return (
    <div className="h-full flex items-center justify-center text-gray-500 text-sm">{message}</div>
  );
}

export function AdminMasterDetailLayout({
  loading,
  error,
  loadingLabel,
  listTitle,
  list,
  detail,
}: Readonly<{
  loading: boolean;
  error: string | null;
  loadingLabel: string;
  listTitle: string;
  list: ReactNode;
  detail: ReactNode;
}>) {
  return (
    <AdminAsyncState loading={loading} error={error} loadingLabel={loadingLabel}>
      <AdminTwoColumnGrid>
        <AdminListSection title={listTitle}>{list}</AdminListSection>
        <AdminDetailSection>{detail}</AdminDetailSection>
      </AdminTwoColumnGrid>
    </AdminAsyncState>
  );
}

export function AdminConfirmModal({
  isOpen,
  titleId,
  title,
  message,
  confirmLabel,
  loadingLabel,
  isLoading,
  onCancel,
  onConfirm,
  children,
  t,
  isEn,
}: Readonly<
  Pick<
    ConfirmModalProps,
    'isOpen' | 'titleId' | 'title' | 'message' | 'isLoading' | 'onCancel' | 'onConfirm'
  > & {
    confirmLabel: string;
    loadingLabel: string;
    children?: ReactNode;
    t: TFunction;
    isEn: boolean;
  }
>) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      titleId={titleId}
      title={title}
      message={message}
      cancelLabel={adminCancelLabel(t, isEn)}
      confirmLabel={confirmLabel}
      loadingLabel={loadingLabel}
      isLoading={isLoading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {children}
    </ConfirmModal>
  );
}

export function AdminDangerConfirmModal({
  isOpen,
  titleId,
  title,
  message,
  isLoading,
  onCancel,
  onConfirm,
  t,
  isEn,
}: Readonly<
  Pick<
    ConfirmModalProps,
    'isOpen' | 'titleId' | 'title' | 'message' | 'isLoading' | 'onCancel' | 'onConfirm'
  > & {
    t: TFunction;
    isEn: boolean;
  }
>) {
  const deleteLabels = adminDeleteLabels(t, isEn);

  return (
    <ConfirmModal
      isOpen={isOpen}
      titleId={titleId}
      title={title}
      message={message}
      cancelLabel={adminCancelLabel(t, isEn)}
      confirmLabel={deleteLabels.confirmLabel}
      loadingLabel={deleteLabels.loadingLabel}
      isLoading={isLoading}
      variant="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
