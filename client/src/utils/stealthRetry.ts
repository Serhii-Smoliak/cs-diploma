export function formatStealthRetryAfter(ms: number, locale: string): string {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  if (totalSeconds < 60) {
    return locale.startsWith('uk') ? `${totalSeconds} сек` : `${totalSeconds}s`;
  }
  const totalMinutes = Math.ceil(totalSeconds / 60);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return locale.startsWith('uk') ? `${hours} год` : `${hours}h`;
    }
    return locale.startsWith('uk') ? `${hours} год ${minutes} хв` : `${hours}h ${minutes}m`;
  }
  return locale.startsWith('uk') ? `${totalMinutes} хв` : `${totalMinutes}m`;
}
