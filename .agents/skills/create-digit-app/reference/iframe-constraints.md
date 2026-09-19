# Iframe constraints

Digit apps run inside a **sandboxed iframe** in the Digit host. Design and implement
only what that environment allows. Do not add direct downloads, new tabs, browser dialogs,
in-iframe device APIs, or anything that escapes the frame. Host-mediated downloads,
printing, and barcode/QR scanning are the exceptions described below.

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
| Camera, mic, geolocation, USB, WebAuthn get, payment, PiP, wake lock, etc. | Permissions Policy `'none'` — for barcodes/QR, use `DigitHost.scan` (below); do not call `getUserMedia` |
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
- Barcode/QR scanning via `DigitHost.scan()` (below). Digit owns the camera and
  returns decoded text — never a `MediaStream`. The host side is not on production
  Digit until [digit-web#4259](https://github.com/Digit-Technologies/digit-web/pull/4259)
  lands a contract that matches the harness.

## Printing HTML

Printing sends a static snapshot. No JavaScript runs in the print document. Prefer a
dedicated receipt/print view or hidden print root and serialize it with `outerHTML`.
Avoid `document.documentElement.outerHTML`, which includes app chrome and usually wastes
the 10MB payload limit.

Prepare the snapshot before calling `DigitHost.print`:

1. Inline CSS in `<style>` or `style` attributes. `<link rel="stylesheet">` is stripped,
   and network CSS is blocked.
2. Fetch images as blobs, then convert them with `FileReader` or canvas to
   `data:image/...`. Remote `http(s)` images do not load (`img-src data:`). Missing
   inline images are the most common reason prints look empty.
3. Replace canvases and charts with `<img>` elements whose `src` comes from
   `canvas.toDataURL('image/png')`.
4. Use system fonts, or embed fonts through `@font-face` with `data:` URLs. Remote fonts
   do not load.
5. Put values in `p`, `table`, `span`, `div`, or other ordinary content elements.
   `form` is removed; `input`, `select`, `textarea`, and `button` stay but are inert.
   Copy each live control value into text before serialization.
6. Keep the UTF-8 HTML at or below 10MB after inlining. Compress images and omit the
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

## Scanning barcodes and QR codes

The app iframe cannot use the camera. Digit sets `camera 'none'` on the frame and does
not pass a `MediaStream` into the sandbox. To scan a barcode or QR code, call
`DigitHost.scan()` — the same host-mediated pattern as download and print.

**Call `DigitHost.scan()`. Do not open the camera in the iframe, and do not
`postMessage` a scan request yourself.** In-iframe scanner libraries,
`navigator.mediaDevices.getUserMedia`, and `<input type="file" accept="image/*"
capture>` fail because the frame is not allowed to use the camera.

This API is not on production Digit yet. The iframe helper is in merged
[digit-apps#138](https://github.com/Digit-Technologies/digit-apps/pull/138). The Digit
web host (consent + scanner) is [digit-web#4259](https://github.com/Digit-Technologies/digit-web/pull/4259)
and must land a matching contract before scan works in production. Until then, still
write apps against `DigitHost.scan()` only.

### Request a scan

```ts
try {
  const result = await window.DigitHost?.scan({
    purpose: "Scan barcode",
  });
  if (!result || result.cancelled) {
    return; // no host, or the user dismissed consent / the scanner
  }
  const code = result.text;
} catch (error) {
  // Throws: host not ready, invalid options, or rate limit (including a quick double-click).
  // Rejects: camera/scan failure, or the host's 60s session timeout.
}
```

Cancel is a resolved `{ cancelled: true }`, not a throw. Missing `DigitHost` makes the
optional-chain return `undefined` — treat that like a no-op, not a crash.

Only one scan at a time. Disable the Scan button until the promise settles. A
double-click within 500ms throws (rate limit). A second `scan()` while consent or the
scanner is still open is dropped by the host, and **that second promise may never
settle**. Do not fire overlapping scans.

### `purpose` and `formats`

`purpose` is optional scan context. Consent UI names the **app** from Digit, not from
this string. If you pass it, it must be 1–199 characters: letters, digits, spaces, and
`. _ ( ) , : / -`, and it must start with a letter or digit. Omit the field rather
than sending `""`, emoji, or a leading `.` — those throw.

Omit `formats` to try **`qr_code`, `code_128`, and `data_matrix`** (what Digit
generates and recognizes today). That default is **not** retail product barcodes.

For a PO / shelf label that is EAN or UPC, pass those types on the same `scan()` call
(still wrap it in the try/catch above):

```ts
formats: ["ean_13", "upc_a", "code_128"],
```

`formats: []` throws. Group aliases (`any`, `gs1_codes`) throw. Allowed names include
`qr_code`, `code_128`, `code_39`, `code_93`, `codabar`, `data_matrix`, `ean_13`,
`ean_8`, `itf`, `pdf417`, `aztec`, `upc_a`, and `upc_e`.

### Why Digit owns the camera

The iframe is untrusted customer code. Camera access stays in Digit:

1. The frame's Permissions Policy keeps `camera 'none'`
2. Digit shows consent and runs `getUserMedia` in its own UI
3. Only decoded text comes back to the app — never a live camera stream or raw photo

Do not ask to add camera to the iframe `allow` list.

### Consent, scanner, and QA

When the app calls `scan()`:

1. Digit shows a consent dialog: **Allow camera access?** — *"{App name} wants to use
   your camera to scan a barcode."* Allow or Cancel. The name comes from Digit, not
   from `purpose`.
2. If the user allows, Digit opens its **camera** scanner.
3. A successful decode resolves `{ text }`. Cancel at either step resolves
   `{ cancelled: true }`. If nothing completes within **60 seconds**, the host times
   out and the promise **rejects**.

The host scanner is camera-only today (no text field to paste a fake barcode). Studio
QA needs a webcam, or a barcode on another screen to point the camera at. Do not mock
`getUserMedia` inside the iframe, and do not tell testers they can paste after Allow
unless Digit’s scanner UI grows a paste path.

### Custom links vs Digit apps

Digit apps and custom-link embeds use different host namespaces (`digit-apps:*` vs
`digit-embed:*`). Do not unify them. From a Digit app, only call `DigitHost.scan()`.
Do not `postMessage` scan (or camera) requests — the harness and Digit web shapes do
not match yet, and a hand-rolled message can hang.

### Limits

- One in-flight scan; disable repeat clicks until it settles
- 30 scan requests per page load
- At least 500ms between requests
- 60s host session timeout (promise rejects)
- Decoded text is capped at 8KB
- No `MediaStream` handoff

## Agent checklist

Before shipping UI:

1. File exports only via `DigitHost.download` — never `<a download>` / blob links
2. Printing only via `DigitHost.print` with self-contained HTML under 10MB
3. Barcode/QR scans only via `DigitHost.scan` (try/catch, one at a time) — never `getUserMedia` or in-iframe cameras
4. No new-tab / popup / `window.open` flows
5. No `alert` / `confirm` / `prompt` — use MUI Dialog / `AppErrorAlert` instead
6. No mic, geo, clipboard-read, fullscreen, or other device APIs
7. Every form submit handler calls `preventDefault`
8. Keep all interaction inside the app iframe (Digit owns the camera UI for scans)
