import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Digit apps must mount to #root');
}

root.innerHTML = `
  <main class="app">
    <p class="eyebrow">Secrets</p>
    <h1>Third-party call</h1>
    <p class="lede">
      The API key stays in Digit as an app secret, injected into the Worker as
      <code>env.THIRD_PARTY_API_KEY</code>. This UI only calls
      <code>/proxy/backend/external-status</code>.
    </p>
    <button id="run" type="button">Check status</button>
    <p id="status" class="status"></p>
    <pre id="output" class="output" hidden></pre>
  </main>
`;

const button = document.getElementById('run')!;
const statusEl = document.getElementById('status')!;
const outputEl = document.getElementById('output')!;

button.addEventListener('click', () => {
  void checkStatus();
});

async function checkStatus() {
  statusEl.textContent = 'Calling backend…';
  outputEl.hidden = true;
  try {
    const response = await fetch('/proxy/backend/external-status', {
      credentials: 'include',
      headers: { 'X-Digit-Proxy-Client': '1' },
    });
    const data = await response.json();
    statusEl.textContent = response.ok ? 'Success' : `HTTP ${response.status}`;
    outputEl.hidden = false;
    outputEl.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    statusEl.textContent =
      error instanceof Error
        ? error.message
        : 'Request failed (expected outside the Digit harness)';
  }
}
