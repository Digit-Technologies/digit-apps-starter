# Sales Order Progress

React + MUI, themed with `@digit/app-theme`'s `DigitThemeProvider`. Shows the 20 most
recent sales orders with a progress bar toward completion, loaded through
`window.DigitProxyClient`.

## Progress metric

Uses `Order.shippedPercentage` (server-computed shipped-vs-ordered quantity) as the bar
fill. `fulfilled`/`closed` orders always show 100%. `cancelled`/`returned`/`refunded`
orders render the bar in red to signal they've stopped progressing rather than reached
completion.

## Notes

- Works only inside the Digit harness (local Vite has no `DigitProxyClient`)
- Never put API tokens in the frontend
- Add more permissions to `public/manifest.json` when you add more GraphQL operations

```bash
npm install
npm run build
```
