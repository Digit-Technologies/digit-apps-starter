# Secrets + third-party API example

React + MUI, themed with `@digit/app-theme`'s `DigitThemeProvider`. Frontend never sees
the API key. The Worker reads `env.THIRD_PARTY_API_KEY` and calls an upstream API,
returning only a safe summary through `/proxy/backend/external-status`.

## Setup in Digit

1. Create the app in Digit
2. Add env var `API_BASE_URL` (e.g. `https://httpbin.org` for a demo)
3. Add secret `THIRD_PARTY_API_KEY`
4. Build and publish (includes `backend/worker.js`)

```bash
npm install
npm run build
```
