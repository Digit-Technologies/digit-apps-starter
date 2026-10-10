# Sutton labels

Do not draw the label or load its records. Pass ids. The host renders it exactly like native print.

## Components

`LabelPrintPanel` is an inline preview with a Print button. Place it anywhere.

```tsx
import { LabelPrintPanel } from '@digit/lib-frontend';

<LabelPrintPanel labelId={labelId} entityType="inventory" entityId={inventoryId} copies={2} />
```

Mount one `LabelPrintPanel` at a time, for the selected record. Never render one per table row.

`LabelPrintDialog`: same props plus `open` and `onClose`. For your own layout, `useLabelPrint` returns `{ preview, error, canPrint, print, ... }`. Render `preview` with `LabelPreview`, and call `print` only while `canPrint` is true.

## printLabel

`printLabel({ labelId, entityType, entityId, copies?, mode })`. Never send template or record JSON.

- `mode: "preview"` returns the label HTML and prints nothing. Show it only with `LabelPreview`.
- `mode: "print"` opens the host print dialog. Call it only after the user confirms the preview.

## Manifest permissions

The host checks these first and names any that is missing:

- `READ_CUSTOM_LABEL_CONFIGURATION` and `READ_ITEM` for every label.
- `READ_INVENTORY` for inventory labels.

The signed-in user must hold them too. On "You don't have permission to print this label", tell the user which permission their role lacks. Do not edit the manifest.

The app's own queries need one permission per type they select, for example `READ_WAREHOUSE_LOCATION` (bin), `READ_JOB` (MO), `READ_PURCHASE_ORDER` (PO). Check every nested object against `appPermissions` before the first preview.

## Preview and live manifests

A Studio preview reads the preview build's manifest. Deploy a new preview before you retry a rejected print. After promote, the live manifest applies. A permission change needs a new preview, then a new promote.

## Failures

`LabelPrintPanel` shows the host's message. The host rejects:

- a label with no composer `layoutJson`, of the wrong type, or that can't be loaded.
- a label size outside 0.5 to 20 inches.
- `copies` outside 1 to 50.
- a document that is too large.
- a call within a second of the last ("Too many calls"), or while another renders ("A label is already being rendered").
- any call on a host that predates `printLabel`.

If preview rejects with "no composer layoutJson", tell the user to build the label in the label builder. Do not draw a fallback.

## Finding the label id

Query `customLabelConfigurations` through the Sutton API (`id labelName type isDefault`). Use `labelTypes: [production, receiving, manual_inventory]` for inventory labels, or `[item]` for item labels. Container and customer labels aren't supported.
