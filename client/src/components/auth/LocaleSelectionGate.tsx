import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { applyLocale } from '../../i18n/applyLocale';
import LocaleSelectionModal from './LocaleSelectionModal';

export default function LocaleSelectionGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsSelection = Boolean(user && !user.preferredLocale);

  const handleSelect = async (locale: string) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updatePreferredLocale(locale);
      updateUser(updated);
      await applyLocale(locale);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save language');
    } finally {
      setSaving(false);
    }
  };

  if (needsSelection) {
    return (
      <>
        <LocaleSelectionModal onSelect={handleSelect} saving={saving} />
        {error && (
          <p className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[101] text-sm text-cyber-danger">
            {error}
          </p>
        )}
      </>
    );
  }

  return <>{children}</>;
}
