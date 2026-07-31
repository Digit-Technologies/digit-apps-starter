# Env vars example

React + MUI, themed with `@digit/app-theme`'s `DigitThemeProvider`. Shows a frontend
calling `/proxy/backend/greeting` while the Worker reads a non-secret env var
(`WELCOME_MESSAGE`) injected by Digit.

## Setup in Digit

1. Create the app in Digit
2. Add env var `WELCOME_MESSAGE` on the app
3. Build and publish this example (includes `backend/worker.js`)

```bash
npm install
npm run build
```

Zip must contain both `frontend/` and `backend/`.
