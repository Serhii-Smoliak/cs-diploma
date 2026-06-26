import type { TFunction } from 'i18next';

export function localizedDefault(isEn: boolean, uk: string, en: string): string {
  return isEn ? en : uk;
}

export function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function adminUiText(
  t: TFunction,
  isEn: boolean,
  key: string,
  uk: string,
  en: string
): string {
  return t(key, { ns: 'ui', defaultValue: localizedDefault(isEn, uk, en) });
}

export function adminLoadingLabel(t: TFunction, isEn: boolean): string {
  return adminUiText(t, isEn, 'loading', 'Завантаження...', 'Loading...');
}

export function adminCancelLabel(t: TFunction, isEn: boolean): string {
  return adminUiText(t, isEn, 'cancel', 'Скасувати', 'Cancel');
}

export function adminDeleteLabels(t: TFunction, isEn: boolean) {
  return {
    confirmLabel: adminUiText(t, isEn, 'delete', 'Видалити', 'Delete'),
    loadingLabel: adminUiText(t, isEn, 'deleting', 'Видалення...', 'Deleting...'),
  };
}

export function adminErrorText(
  t: TFunction,
  isEn: boolean,
  key: string,
  uk: string,
  en: string,
  err: unknown
): string {
  return toErrorMessage(err, adminUiText(t, isEn, key, uk, en));
}
