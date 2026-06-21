import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/index.css'
import { applyLocale, normalizeLocale } from './i18n/applyLocale'

function getInitialLanguage(): 'uk' | 'en' {
  try {
    const raw = localStorage.getItem('cybertactics-auth');
    if (raw) {
      const parsed = JSON.parse(raw) as {
        state?: { isAuthenticated?: boolean; user?: { preferredLocale?: string | null } };
      };
      const { isAuthenticated, user } = parsed.state ?? {};
      if (isAuthenticated && user) {
        if (user.preferredLocale) {
          return normalizeLocale(user.preferredLocale);
        }
        return 'uk';
      }
    }
  } catch {
    // ignore malformed persisted auth
  }

  const stored = localStorage.getItem('i18nextLng');
  if (stored?.startsWith('en')) {
    return 'en';
  }

  return 'uk';
}

const initApp = async () => {
  const currentLanguage = getInitialLanguage();
  await applyLocale(currentLanguage);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
};

initApp().catch(console.error);
