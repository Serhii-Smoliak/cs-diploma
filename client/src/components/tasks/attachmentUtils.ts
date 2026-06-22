export function toggleAttachmentSelection(selectedIds: string[], attachmentId: string): string[] {
  return selectedIds.includes(attachmentId)
    ? selectedIds.filter((id) => id !== attachmentId)
    : [...selectedIds, attachmentId];
}

export function getAttachmentIcon(type: string): string {
  if (type.includes('word')) return '📄';
  if (type.includes('exe')) return '⚙️';
  return '📁';
}
