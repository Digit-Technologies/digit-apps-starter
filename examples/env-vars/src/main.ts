import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Digit apps must mount to #root');
}

root.innerHTML = `
  <main class="app">
    <p class="eyebrow">Env vars</p>
    <h1>Backend config</h1>
    <p class="lede">
      Non-secret values are set on the app in Digit and read by the Worker via
      <code>env.WELCOME_MESSAGE</code>. The frontend only sees them through
      <code>/proxy/backend</code>.
    </p>
    <p id="status" class="status">Loading…</p>
    <pre id="output" class="output" hidden></pre>
  </main>
`;

const statusEl = document.getElementById('status')!;
const outputEl = document.getElementById('output')!;

async function loadGreeting() {
  try {
    const response = await fetch('/proxy/backend/greeting', {
      credentials: 'include',
      headers: { 'X-Digit-Proxy-Client': '1' },
    });
    if (!response.ok) {
      statusEl.textContent = `Backend returned ${response.status}`;
      return;
    }
    const data = (await response.json()) as { message: string; source: string };
    statusEl.textContent = 'Loaded from Worker env';
    outputEl.hidden = false;
    outputEl.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    statusEl.textContent =
      error instanceof Error
        ? error.message
        : 'Request failed (expected outside the Digit harness)';
  }
}

void loadGreeting();
