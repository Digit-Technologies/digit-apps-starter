import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Digit apps must mount to #root');
}

root.innerHTML = `
  <main class="app">
    <p class="eyebrow">Digit App</p>
    <h1>Hello World</h1>
    <p class="lede">A minimal frontend-only Digit app.</p>
  </main>
`;
