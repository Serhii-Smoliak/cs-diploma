import type { TFunction } from 'i18next';

export type SupportTicketCloseReason = 'ANSWERED' | 'DECLINED' | 'CUSTOM';

export function getSupportCloseReasonLabel(
  closeReason: SupportTicketCloseReason | null | undefined,
  closeReasonText: string | null | undefined,
  t: TFunction,
  isEn: boolean
): string | null {
  if (!closeReason) {
    return null;
  }

  if (closeReason === 'CUSTOM') {
    return closeReasonText?.trim() || null;
  }

  return t(`supportCloseReason.${closeReason}`, {
    ns: 'ui',
    defaultValue:
      closeReason === 'ANSWERED'
        ? isEn
          ? 'Answer provided'
          : 'Відповідь надана'
        : isEn
          ? 'Request does not meet requirements'
          : 'Звернення не відповідає вимогам',
  });
}

export const SUPPORT_CLOSE_REASON_OPTIONS: SupportTicketCloseReason[] = [
  'ANSWERED',
  'DECLINED',
  'CUSTOM',
];
