import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';

export function localizedDefault(isEn: boolean, uk: string, en: string): string {
  return isEn ? en : uk;
}

export function adminLoadingLabel(t: TFunction, isEn: boolean): string {
  return t('loading', {
    ns: 'ui',
    defaultValue: localizedDefault(isEn, 'Завантаження...', 'Loading...'),
  });
}

export function adminCancelLabel(t: TFunction, isEn: boolean): string {
  return t('cancel', {
    ns: 'ui',
    defaultValue: localizedDefault(isEn, 'Скасувати', 'Cancel'),
  });
}

export function adminDeleteLabels(t: TFunction, isEn: boolean) {
  return {
    confirmLabel: t('delete', {
      ns: 'ui',
      defaultValue: localizedDefault(isEn, 'Видалити', 'Delete'),
    }),
    loadingLabel: t('deleting', {
      ns: 'ui',
      defaultValue: localizedDefault(isEn, 'Видалення...', 'Deleting...'),
    }),
  };
}

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
