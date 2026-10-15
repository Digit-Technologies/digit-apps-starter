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

| Pattern                                          | Use it for                                                  | Built with                                    |
| ------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------- |
| [Index page with a table](#index-page-with-a-table) | Browsing a list of records                               | `Table`, `StatusChip`, `Button`, `Tabs`       |
| [Settings and detail panel](#settings-and-detail-panel) | Settings, or the details of one record, beside the page | `Drawer` (right), `Tabs`, `Switch`, `Select`  |
| [Secondary actions menu](#secondary-actions-menu) | Grouping secondary actions behind one button            | `IconButton`, `Menu`, `MenuItem`              |
| [Primary action](#primary-action)                | The one main thing a surface asks the user to do            | `Button` (primary)                            |
| [Tabs](#tabs)                                    | Switching between views of the same data                    | `Tabs`, `Tab`                                 |
| [Status and tone](#status-and-tone)              | Showing a state or a category                               | `StatusChip`                                  |
| [Checklist with progress](#checklist-with-progress) | Ordered tasks that get marked complete                    | `LinearProgress`, `List`, `StatusChip`        |
| [Chat composer](#chat-composer)                  | A box where the user types or talks to an assistant         | `TextField`, `IconButton`, `Stack`            |
| [Confirmations](#confirmations)                  | Destructive actions, and actions blocked by something else | `Dialog` (small), `Button color="error"`      |

## Shared visual rules

These apply everywhere.

- **Radius is soft.** Buttons and chips use the theme's small radius. Panels and dialogs
  round more. Do not add heavy borders or drop shadows to cards.
- **Surfaces are neutral.** Use the grey scale for backgrounds, and `text.primary` /
  `text.secondary` for type. The page is light and calm.
- **Charcoal is the action colour.** The primary button is the theme's `primary`, which is
  black-grey. Blue is for selection (checkboxes, switches, radios). Red is only for
  destructive actions and blocked states.
- **Status uses tone, not decoration.** Each tone has one meaning. See
  [Status and tone](#status-and-tone).
- **Icons come from one thin line set.** Pick one icon family and one size per context.
  Do not mix filled and outlined icons on one screen. Icon-only buttons need an
  `aria-label`.
- **Type is Inter, sentence case.** Titles are bold. Labels, buttons and menu items are
  sentence case, not Title Case and not all caps.
- **Explain, don't just disable.** If something is unavailable, show why next to it.

---

## Index page with a table

A page of records is a title, an optional row of tabs, a primary action at the top right,
then a table.

- The title says what the list is. The primary action creates a new record.
- Table rows lead with a bold name, then muted facts in aligned columns. Use a status chip
  for the state a user scans for, and `AvatarGroup` for people.
- Use relative time for recent edits ("10 mins ago") and an absolute date for creation.
- Clicking a row opens its details in the [settings and detail panel](#settings-and-detail-panel).
  Show a chevron when the whole row is clickable.
- Pagination is required. Sort through the API, not on a full list in the browser. See the
  table rule in SKILL.md.
- If the app already has a table component, use it. Do not restyle a new table per screen.

## Settings and detail panel

A panel docked to the right edge, opened from the page for settings or for one record's
details. It sits beside the content, so the list stays visible.

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

## Status and tone

Use `StatusChip` for any state or category. It is the one place a status gets its colour.

```tsx
import { StatusChip } from "@digit/lib-frontend"

<StatusChip status="in progress" />   // tone comes from the status word
<StatusChip status={order.state} />   // unknown words render as neutral
<StatusChip color="info" label="Custom" />  // an explicit tone, when it is not a status
```

- `status` looks up the tone from the shared status list. The label is the status, in
  sentence case, unless you pass `label`.
- `color` sets the tone directly, for categories that are not statuses. When both are set,
  `color` wins.
- Pick the tone from the meaning, not the look:

| Tone      | Meaning                                | Example status words                                          |
| --------- | -------------------------------------- | ------------------------------------------------------------- |
| `default` | Not started, set aside, or unknown     | `draft`, `not started`, `archived`, `inactive`, `cancelled`   |
| `success` | Done, live, or approved                | `done`, `complete`, `live`, `published`, `approved`, `paid`   |
| `warning` | Waiting on someone or something        | `pending`, `in progress`, `awaiting`, `invited`               |
| `error`   | Stopped, failed, or blocked            | `blocked`, `failed`, `rejected`, `overdue`, `expired`         |
| `info`    | Active or under way                    | `active`, `building`, `open`, `scheduled`, `custom`           |

- The default tone is outlined. The other tones are tinted.
- Do not pick colours by hand, and do not use `Chip` directly for statuses. If a status
  word is missing from the list, pass the right `color` for this one use and tell the
  user the word should be added to `statusTones` in `@digit/lib-frontend`.

## Checklist with progress

An ordered list of tasks grouped into sections, each with a completion measure.

- Each section has a bold heading and a thin progress bar with a percentage.
- Each row has a completion marker, a bold title, a muted description, and a status chip
  on the right.
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

Two kinds, both short.

**Destructive.** A small centred dialog with a question as the title ("Delete role?"),
one line on the consequence ("This cannot be undone"), Cancel as a text button on the
left, and the destructive button in red on the right.

**Blocked.** When an action cannot happen because something else must change first, the
dialog says what blocks it and gives a button that takes the user to fix it. Use a
warning icon, no red button, and the primary charcoal for the fix.

- Use `Dialog` with a small `maxWidth`. Never use the browser `confirm()`; the iframe
  blocks it. See [iframe-constraints.md](iframe-constraints.md).
