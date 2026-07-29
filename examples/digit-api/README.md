# Digit API example

Calls Digit GraphQL through `window.DigitProxyClient` with `read:item` declared in
`public/manifest.json`.

## Notes

- Works only inside the Digit harness (local Vite has no `DigitProxyClient`)
- Never put API tokens in the frontend
- Add more permissions to the manifest when you add more GraphQL operations

```bash
npm install
npm run build
```
