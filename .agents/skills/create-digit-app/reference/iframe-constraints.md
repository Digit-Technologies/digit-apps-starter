# Iframe constraints

Digit apps run inside a **sandboxed iframe** in the Digit host. Design and implement
only what that environment allows. Do not add downloads, new tabs, browser dialogs,
device APIs, or anything that escapes the frame.

## Host iframe settings

These are the effective host attributes (do not assume looser permissions):

```
sandbox="allow-scripts allow-same-origin"
```

Permissions Policy (`allow`) sets every listed feature to `'none'`:

accelerometer, autoplay, camera, clipboard-read, clipboard-write, display-capture,
encrypted-media, fullscreen, gamepad, geolocation, gyroscope, magnetometer,
microphone, midi, payment, picture-in-picture, publickey-credentials-get,
screen-wake-lock, usb, xr-spatial-tracking.

Only `allow-scripts` and `allow-same-origin` are granted. Everything else the
sandbox can gate (downloads, popups, modals, forms submit, top navigation, etc.)
is **off**.

## Do not use (blocked)

| Pattern | Why |
| --- | --- |
| File downloads (`<a download>`, blob download links, “Export CSV” via download) | No `allow-downloads` |
| `window.open`, `target="_blank"`, “Open in new tab” | No `allow-popups` |
| `alert` / `confirm` / `prompt` | No `allow-modals` |
| Native HTML form submit / navigation | No `allow-forms` — use React `onSubmit` + `preventDefault` and fetch/hooks instead |
| Navigating the parent Digit page (`top.location`, etc.) | No top-navigation flags |
| Fullscreen API | `fullscreen 'none'` |
| Clipboard (`navigator.clipboard`, paste/copy APIs) | `clipboard-read` / `clipboard-write 'none'` |
| Camera, mic, geolocation, USB, WebAuthn get, payment, PiP, wake lock, etc. | Permissions Policy `'none'` |
| Autoplay media | `autoplay 'none'` |

Do not build UI that depends on these working, and do not “fall back” to a blocked
API after a failed attempt.

## Do use (works in-frame)

- SPA navigation and in-iframe links (same document / React Router-style)
- MUI **Dialog**, Drawer, Menu, Popover, Snackbar — these are in-page overlays, not
  browser `window.alert`-style modals
- Digit proxies and hooks (`useDigitApiQuery`, `useBackendQuery`, …)
- Showing exportable data **in the UI** (tables, copy-friendly text fields) instead
  of triggering a file download — note clipboard write is also blocked, so prefer
  selectable text / in-app display over “Copy” buttons that use the Clipboard API

## Agent checklist

Before shipping UI:

1. No download buttons or export-as-file flows
2. No new-tab / popup / `window.open` flows
3. No `alert` / `confirm` / `prompt` — use MUI Dialog / `AppErrorAlert` instead
4. No camera, mic, geo, clipboard, fullscreen, or other device APIs
5. Keep all interaction inside the app iframe
