# Design patterns

The theme makes an app look like Digit. These patterns make it **work** like Digit: where
things sit, how lists read, how actions are grouped, and how status is shown. Read this
before you lay out a screen. [theming.md](theming.md) covers the palette and component
overrides.

## How to use this file

1. Find the closest need in the index.
2. Build with the reusable piece named there. If the app already has one, use it.
3. If no pattern fits, say so in your summary. Do not invent a layout.

## Index

| Pattern                                             | Use it for                                                  | Built with                                    |
| --------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| [Index page with a table](#index-page-with-a-table) | Browsing a list of records                                  | `Table`, `Pill`, `Button`, `Tabs`             |
| [Settings and detail panel](#settings-and-detail-panel) | Settings, or the details of one record, beside the page | `Drawer` (right), `Tabs`, `Switch`, `Select`  |
| [Secondary actions menu](#secondary-actions-menu)   | Grouping secondary actions behind one button                | `IconButton`, `Menu`, `MenuItem`              |
| [Primary action](#primary-action)                   | The one main thing a surface asks the user to do            | `Button` (primary)                            |
| [Tabs](#tabs)                                       | Switching between views of the same data                    | `Tabs`, `Tab`                                 |
| [Colour and status](#colour-and-status)             | Showing a state or a category                               | `Pill`                                        |
| [Checklist with progress](#checklist-with-progress) | Ordered tasks that get marked complete                      | `LinearProgress`, `List`, `Pill`              |
| [Chat composer](#chat-composer)                     | A box where the user types or talks to an assistant         | `TextField`, `IconButton`, `Stack`            |
| [Confirmations](#confirmations)                     | Any destructive action, and actions blocked by something else | `ConfirmDialog`                             |

## Shared visual rules

These apply everywhere.

- **Radius is soft.** Buttons and pills use the theme's small radius. Panels and dialogs
  round more. Do not add heavy borders or drop shadows to cards.
- **Surfaces are neutral.** Backgrounds are the stone scale. Type is `text.primary`, with
  `text.secondary` for supporting text. The page is light and calm.
- **Charcoal is the action colour.** The primary button is the theme's `primary`, which is
  black-grey. Blue means selected (checkboxes, switches, radios). Red means destructive or
  error. Nothing else.
- **Icons come from one thin line set.** Pick one icon family and one size per context.
  Do not mix filled and outlined icons on one screen. Icon-only buttons need an
  `aria-label`.
- **Type is Inter, sentence case.** Titles are bold. Labels, buttons and menu items are
  sentence case, not Title Case and not all caps.
- **Explain, don't just disable.** If something is unavailable, show why next to it.

### Colours: use the palette, nothing else

Every colour comes from the theme palette. Do not write hex values, `rgb()`, or colour
names from MUI's defaults (MUI's default blue, or `grey.500` from a stock theme).

- **Roles:** `primary` (charcoal), `secondary`, `success`, `warning`, `error`, `info`.
  Use them for meaning: success for done, warning for waiting, error for stopped, info for
  active. Read the shade with `main`, `light` or `dark`, for example
  `sx={{ color: "error.main" }}`.
- **Neutrals:** `stone`, plus `text.primary`, `text.secondary`, `text.disabled`,
  `background.default` and `background.paper`. `grey` is also mapped to the stone scale.
- **Accents:** `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`,
  `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`. Use these
  for categories that are not a meaning, for example a label colour a user picks.

```tsx
import { useTheme } from "@mui/material/styles"

const theme = useTheme()
<Box sx={{ bgcolor: "purple.light", color: "purple.dark" }} />
theme.palette.violet.main        // read a value in code
```

If the design needs a colour that is not in the palette, say so. Do not add one locally.

---

## Index page with a table

A page of records is a title, an optional row of tabs, a primary action at the top right,
then a table.

- The title says what the list is. The primary action creates a new record.
- Table rows lead with a bold name, then muted facts in aligned columns. Use a `Pill` for
  the state a user scans for, and `AvatarGroup` for people.
- Use relative time for recent edits ("10 mins ago") and an absolute date for creation.
- Clicking a row opens its details in the [settings and detail panel](#settings-and-detail-panel).
  Show a chevron when the whole row is clickable.
- Pagination is required. Sort and filter through the API, not on a full list in the
  browser. See the table rule in SKILL.md.
- If the app already has a table component, use it. Do not restyle a new table per screen.

## Settings and detail panel

A side panel docked to the right edge, opened from the page for settings or for one
record's details. It sits beside the content, so the list stays visible. Apps usually have
few settings, so this is the only settings surface. Do not build a full-screen settings
modal.

- Header: the title on the left, a close (×) on the right. Optional tabs under the header.
- Body: sections of label-left rows. The label sits on the left, the control on the right.
  Use `Switch` for on/off, `Select` for a fixed set, and a text field for free text.
- If the panel edits data, put one primary action in a footer on the right. A read-only
  details panel has no footer.
- Build one panel component and reuse it across the app. Do not build a new side panel
  per screen.

## Secondary actions menu

Actions that are not the main thing (duplicate, export, delete) go behind a single
**⋯** icon button, not as extra buttons next to the primary action. The ⋯ button is what
this pattern is called; the menu it opens groups the secondary actions.

- `IconButton` with `aria-label="More actions"`, opening a `Menu`.
- List the actions in sentence case. Put the destructive one last, in red, below a divider.
  Destructive items still open a [confirmation](#confirmations).
- The primary action stays visible outside the menu.

## Primary action

Each surface has one primary action: a filled charcoal `Button` with a label and, where it
helps, an icon.

- Top right of a page for creating something. Right side of a panel or dialog footer for
  saving.
- Secondary actions are outlined buttons. Tertiary ones are text buttons.
- Cancel is a text button on the left of the footer when there is a save.
- The primary button is never red. Red is for destructive actions only.

## Tabs

Tabs sit under the page title and switch between views of the same data (for example
"Your features" and "All features"). They are not for moving between apps.

- Use an underline indicator. An icon in the first tab is fine.
- Keep tab labels to one or two words.

## Colour and status

Use `Pill` for any status or category. It is the one place a status gets its colour.

```tsx
import { Pill } from "@digit/lib-frontend"

<Pill status="in progress" />              // warning tone, from the status word
<Pill status={order.state} />              // unknown words render as the neutral tone
<Pill color="purple" label="Vendor" />     // any palette colour, for a category
```

- `status` takes the tone from the shared status list below. The label is the status in
  sentence case, unless you pass `label`.
- `color` sets the colour directly. Pass any tone (`success`, `warning`, `error`, `info`,
  `default`) or any accent (`purple`, `teal`, and so on). When both are set, `color` wins.
- The default tone is outlined. Every other colour is tinted.

Only the obvious statuses are on the list. Anything else is a category, so pass `color`:

| Tone      | Meaning                    | Status words                                          |
| --------- | -------------------------- | ----------------------------------------------------- |
| `default` | Not started, or set aside  | `draft`, `not started`, `archived`                    |
| `info`    | Active                     | `active`                                              |
| `warning` | Waiting                    | `pending`, `in progress`                              |
| `error`   | Stopped                    | `blocked`, `failed`                                   |
| `success` | Done                       | `complete`, `completed`, `done`                       |

- Do not use `Chip` directly for statuses. Do not pick colours by hand.
- If a status word is missing from the list, pass the right `color` for this one use and
  tell the user the word should be added to the status list in `@digit/lib-frontend`.

## Checklist with progress

An ordered list of tasks grouped into sections, each with a completion measure.

- Each section has a bold heading and a thin progress bar with a percentage.
- Each row has a completion marker, a bold title, a muted description, and a `Pill` on the
  right.
- Done rows stay where they are. Do not reorder the list when a task completes.
- A blocked task shows the reason and who is fixing it, in one line under the row.

## Chat composer

A conversation column with a composer at the bottom. The composer is a text field with a
placeholder, an optional attach button (+) and a send button, which is an icon button in
the primary charcoal.

- Assistant messages sit in soft cards. The user's messages are muted pills or bubbles.
- Keep the composer pinned to the bottom. Do not put it in a panel that scrolls away.
- Use the same send button style as the primary action.

## Confirmations

**Any destructive action asks first.** Delete, remove, cancel an order, or any change that
cannot be undone opens a confirmation before it runs. A non-destructive change, such as
renaming or saving a draft, does not need one.

Use `ConfirmDialog` from `@digit/lib-frontend`. Never use the browser `confirm()`: the app
iframe blocks it.

```tsx
import { ConfirmDialog } from "@digit/lib-frontend"

<ConfirmDialog
  open={confirmOpen}
  title="Delete role?"
  description="This cannot be undone."
  confirmLabel="Delete"
  destructive
  busy={deleting}
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>
```

- Title is a question. Description is one line on the consequence.
- Confirm label is the verb ("Delete", "Remove"), never "OK".
- `destructive` makes the confirm button red and puts focus on Cancel, so Enter does not
  delete by accident.
- Set `busy` while the action runs, and close the dialog only when it succeeds.

**Blocked.** When an action cannot happen because something else must change first, use
the same dialog with a non-destructive label that takes the user to the fix. Name what
blocks the action in the description, and do not use red.

```tsx
<ConfirmDialog
  open={blockedOpen}
  title="Can't delete role"
  description="This role is assigned to users. Reassign them first."
  confirmLabel="Go to users"
  onConfirm={goToUsers}
  onCancel={() => setBlockedOpen(false)}
/>
```

- Navigating to another part of Digit goes through the host. Check `getHostCapabilities`
  for a navigation method before you write one.
