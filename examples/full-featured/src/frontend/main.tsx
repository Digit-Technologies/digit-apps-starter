import { createRoot } from 'react-dom/client';

import { SuttonThemeProvider } from '@digit/lib-frontend';

import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Sutton apps must mount to #root');

createRoot(rootEl).render(
  <SuttonThemeProvider>
    <App />
  </SuttonThemeProvider>,
);
