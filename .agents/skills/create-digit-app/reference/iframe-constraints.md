# Iframe constraints

Digit apps run inside a **sandboxed iframe** in the Digit host. Design and implement
only what that environment allows. Do not add direct downloads, new tabs, browser dialogs,
device APIs, or anything that escapes the frame. Host-mediated downloads and printing
are the exceptions described below.

## Host iframe settings

These are the effective host attributes (do not assume looser permissions):

```
sandbox="allow-scripts allow-same-origin allow-forms"
```

Permissions Policy (`allow`) sets every listed feature to `'none'`:

accelerometer, autoplay, camera, clipboard-read, display-capture,
encrypted-media, fullscreen, gamepad, geolocation, gyroscope, magnetometer,
microphone, midi, payment, picture-in-picture, publickey-credentials-get,
screen-wake-lock, usb, xr-spatial-tracking.

`clipboard-write` is allowed: `navigator.clipboard.writeText` works inside a user
gesture (a click handler), so "Copy" buttons are fine. `clipboard-read` is not.

Everything else the sandbox can gate (downloads, popups, modals, top navigation,
etc.) is **off**. `allow-forms` only means React `onSubmit` handlers fire — a
native form submission (no `preventDefault`) navigates the frame to an error, so
always intercept and post JSON.

## Do not use (blocked)

| Pattern                                                                    | Why                                                                                       |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Direct file downloads (`<a download>`, blob download links)                | No `allow-downloads` — use `DigitHost.download` (below)                                   |
| Direct `window.print()` / print windows                                    | No `allow-modals` or `allow-popups` — use `DigitHost.print` (below)                       |
| `window.open`, `target="_blank"`, “Open in new tab”                        | No `allow-popups`                                                                         |
| `alert` / `confirm` / `prompt`                                             | No `allow-modals`                                                                         |
| Native HTML form submission (no `preventDefault`)                          | Navigates the frame to a proxy error — always `onSubmit` + `preventDefault` + fetch/hooks |
| Navigating the parent Digit page (`top.location`, etc.)                    | No top-navigation flags                                                                   |
| Fullscreen API                                                             | `fullscreen 'none'`                                                                       |
| Reading the clipboard (`navigator.clipboard.read*`, paste APIs)            | `clipboard-read 'none'`                                                                   |
| Camera, mic, geolocation, USB, WebAuthn get, payment, PiP, wake lock, etc. | Permissions Policy `'none'`                                                               |
| Autoplay media                                                             | `autoplay 'none'`                                                                         |

Do not build UI that depends on these working, and do not “fall back” to a blocked
API after a failed attempt.

## Do use (works in-frame)

- SPA navigation and in-iframe links (same document / React Router-style)
- MUI **Dialog**, Drawer, Menu, Popover, Snackbar — these are in-page overlays, not
  browser `window.alert`-style modals
- Digit proxies and hooks (`useDigitApiQuery`, `useBackendQuery`, …)
- Forms with `onSubmit` + `preventDefault`, posting JSON via fetch/hooks
- “Copy” buttons via `navigator.clipboard.writeText(...)` inside a click handler
- File exports via `DigitHost.download({ filename, contentType, data })` — the host
  page saves the file. `contentType` must be `text/csv`, `application/json`,
  `text/plain`, `application/pdf` or
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx only —
  legacy `.xls` and macro-enabled types are refused);
  `data` is a string or `ArrayBuffer`/`Uint8Array`,
  10MB max; the matching extension is appended automatically. Throws with a reason
  on invalid input, so surface errors from it like any other failure
- Browser printing via `DigitHost.print({ title, html })`. The host sanitizes the HTML
  and opens the print dialog from its own frame. The app iframe never receives
  `allow-modals`

## Printing HTML

Printing sends a static snapshot. No JavaScript runs in the print document. Prefer a
dedicated receipt/print view or hidden print root and serialize it with `outerHTML`.
Avoid `document.documentElement.outerHTML`, which includes app chrome and usually wastes
the 1 MiB payload limit.

Prepare the snapshot before calling `DigitHost.print`:

1. Inline CSS in `<style>` or `style` attributes. `<link rel="stylesheet">` is stripped,
   and network CSS is blocked.
2. Fetch images as blobs, then convert them with `FileReader` or canvas to
   `data:image/...`. HTTP(S) image URLs are stripped. Missing inline images are the most
   common reason prints look empty.
3. Replace canvases and charts with `<img>` elements whose `src` comes from
   `canvas.toDataURL('image/png')`.
4. Use system fonts, or embed fonts through `@font-face` with `data:` URLs. Remote fonts
   do not load.
5. Put values in `p`, `table`, `span`, `div`, or other ordinary content elements.
   `input`, `select`, `textarea`, `button`, and `form` are stripped. Copy each live
   control value into text before serialization.
6. Keep the UTF-8 HTML at or below 1 MiB after inlining. Compress images and omit the
   rest of the SPA.
7. Use a 1-119 character title that starts with an ASCII letter or digit and contains
   only ASCII letters, digits, spaces, `.`, `_`, `-`, `(`, or `)`. Do not use accents or
   emoji.

```ts
const html = `
  <style>
    body { font: 14px system-ui; color: #111; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 6px; border-bottom: 1px solid #ddd; text-align: left; }
  </style>
  <main>
    <h1>Packing slip 1042</h1>
    <table><tr><th>Item</th><th>Qty</th></tr><tr><td>Widget</td><td>2</td></tr></table>
  </main>`;

window.DigitHost?.print({ title: "Packing Slip 1042", html });
```

Do not use `window.open`, `target="_blank"`, blob navigation, or print-window patterns.
Never ask for more sandbox flags. For PDF bytes, call `DigitHost.download` with
`application/pdf`; `DigitHost.print` accepts HTML only.

## Agent checklist

Before shipping UI:

1. File exports only via `DigitHost.download` — never `<a download>` / blob links
2. Printing only via `DigitHost.print` with self-contained HTML under 1 MiB
3. No new-tab / popup / `window.open` flows
4. No `alert` / `confirm` / `prompt` — use MUI Dialog / `AppErrorAlert` instead
5. No camera, mic, geo, clipboard-read, fullscreen, or other device APIs
6. Every form submit handler calls `preventDefault`
7. Keep all interaction inside the app iframe
