import { motion } from 'framer-motion';

const LANGUAGES = [
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
] as const;

interface LocaleSelectionModalProps {
  onSelect: (locale: string) => void;
  saving?: boolean;
}

export default function LocaleSelectionModal({ onSelect, saving = false }: LocaleSelectionModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-cyber-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="cyber-panel w-full max-w-md border-2 border-cyber-primary p-6 sm:p-8 shadow-2xl"
        role="dialog"
        aria-labelledby="locale-selection-title"
        aria-modal="true"
      >
        <h1
          id="locale-selection-title"
          className="font-heading font-bold text-2xl text-cyber-primary mb-2"
        >
          Choose your language
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          Select the language for the CyberTactics interface. You can change it later from the top bar.
        </p>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              disabled={saving}
              onClick={() => onSelect(lang.code)}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-cyber-border bg-cyber-panel/50 text-left transition-all hover:border-cyber-primary hover:bg-cyber-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-heading font-bold text-lg text-white">{lang.name}</span>
            </button>
          ))}
        </div>

        {saving && (
          <p className="mt-4 text-sm text-center text-gray-400">Saving your preference…</p>
        )}
      </motion.div>
    </div>
  );
}
