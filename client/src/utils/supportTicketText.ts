import type { TFunction } from 'i18next';

export type SupportTicketCloseReason = 'ANSWERED' | 'DECLINED' | 'CUSTOM';

export type SupportTicketStatus = 'OPEN' | 'ANSWERED' | 'CLOSED';

function getSupportCloseReasonDefaultLabel(
  closeReason: Exclude<SupportTicketCloseReason, 'CUSTOM'>,
  isEn: boolean
): string {
  if (closeReason === 'ANSWERED') {
    return isEn ? 'Answer provided' : 'Відповідь надана';
  }
  return isEn ? 'Request does not meet requirements' : 'Звернення не відповідає вимогам';
}

export function getSupportStatusDefaultLabel(status: SupportTicketStatus, isEn: boolean): string {
  if (status === 'OPEN') {
    return isEn ? 'Open' : 'Відкрито';
  }
  if (status === 'ANSWERED') {
    return isEn ? 'Answered' : 'Відповідь надано';
  }
  return isEn ? 'Closed' : 'Закрито';
}

export function getSupportStatusLabel(
  status: SupportTicketStatus,
  t: TFunction,
  isEn: boolean
): string {
  return t(`supportStatus.${status}`, {
    ns: 'ui',
    defaultValue: getSupportStatusDefaultLabel(status, isEn),
  });
}

export function getSupportCloseReasonOptionDefaultLabel(
  reason: SupportTicketCloseReason,
  isEn: boolean
): string {
  if (reason === 'ANSWERED') {
    return isEn ? 'Answer provided' : 'Відповідь надана';
  }
  if (reason === 'DECLINED') {
    return isEn ? 'Request does not meet requirements' : 'Звернення не відповідає вимогам';
  }
  return isEn ? 'Custom reason' : 'Інша причина';
}

export function getSupportCloseReasonOptionLabel(
  reason: SupportTicketCloseReason,
  t: TFunction,
  isEn: boolean
): string {
  return (
    getSupportCloseReasonLabel(reason, null, t, isEn) ??
    t(`supportCloseReason.${reason}`, {
      ns: 'ui',
      defaultValue: getSupportCloseReasonOptionDefaultLabel(reason, isEn),
    })
  );
}

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
    defaultValue: getSupportCloseReasonDefaultLabel(closeReason, isEn),
  });
}

export const SUPPORT_CLOSE_REASON_OPTIONS: SupportTicketCloseReason[] = [
  'ANSWERED',
  'DECLINED',
  'CUSTOM',
];
