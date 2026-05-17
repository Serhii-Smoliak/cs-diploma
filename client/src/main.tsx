import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './styles/index.css'
import i18n, { loadMultipleNamespaces } from './i18n/config'

const initApp = async () => {
  let currentLanguage = i18n.language || 'uk';

  if (currentLanguage !== 'uk' && currentLanguage !== 'en') {
    currentLanguage = 'uk';
    i18n.changeLanguage(currentLanguage);
  }
  
  const namespaces = ['common', 'mitre', 'tasks', 'missions', 'ui', 'skillMatrix', 'levels', 'dialogues'];
  await loadMultipleNamespaces(currentLanguage, namespaces);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
};

initApp().catch(console.error);

