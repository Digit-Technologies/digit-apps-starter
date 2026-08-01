import { createRoot } from 'react-dom/client';

import { DigitThemeProvider } from '@digit/app-frontend';

import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Digit apps must mount to #root');

createRoot(rootEl).render(
  <DigitThemeProvider>
    <App />
  </DigitThemeProvider>,
);
