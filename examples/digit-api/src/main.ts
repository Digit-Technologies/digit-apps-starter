import './styles.css';

type ItemsResult = {
  data?: {
    items?: {
      nodes?: Array<{ id: string; name?: string | null; sku?: string | null }>;
    };
  };
  errors?: Array<{ message: string }>;
  error?: { code: string; message: string };
};

const ITEMS_QUERY = `
  query Items($connection: ConnectionInput) {
    items(connection: $connection) {
      nodes {
        id
        name
        sku
      }
    }
  }
`;

const root = document.getElementById('root');
if (!root) {
  throw new Error('Digit apps must mount to #root');
}

root.innerHTML = `
  <main class="app">
    <p class="eyebrow">Digit API</p>
    <h1>Items</h1>
    <p class="lede">Loaded through <code>DigitProxyClient</code> (never a browser token).</p>
    <p id="status" class="status">Loading…</p>
    <ul id="list" class="list"></ul>
  </main>
`;

const statusEl = document.getElementById('status')!;
const listEl = document.getElementById('list')!;

async function loadItems() {
  const client = window.DigitProxyClient;
  if (!client) {
    statusEl.textContent =
      'DigitProxyClient is unavailable. This page only works inside the Digit app harness.';
    return;
  }

  try {
    const result = (await client.callProxy({
      query: ITEMS_QUERY,
      variables: { connection: { first: 10 } },
    })) as ItemsResult;

    if (result.error) {
      statusEl.textContent = `${result.error.code}: ${result.error.message}`;
      return;
    }
    if (result.errors?.length) {
      statusEl.textContent = result.errors.map((e) => e.message).join('; ');
      return;
    }

    const nodes = result.data?.items?.nodes ?? [];
    statusEl.textContent = nodes.length ? `${nodes.length} item(s)` : 'No items found.';
    listEl.innerHTML = nodes
      .map(
        (item) =>
          `<li><strong>${escapeHtml(item.name ?? 'Untitled')}</strong>` +
          `<span>${escapeHtml(item.sku ?? item.id)}</span></li>`,
      )
      .join('');
  } catch (error) {
    statusEl.textContent = error instanceof Error ? error.message : 'Request failed';
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

void loadItems();
