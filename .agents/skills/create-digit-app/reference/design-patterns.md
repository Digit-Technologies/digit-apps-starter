# Design patterns

Theme tokens make an app look like Digit. Patterns make it **behave** like Digit: how
navigation is laid out, how lists read, how destructive actions are confirmed, how guided
flows feel. Read this before you lay out any screen. [theming.md](theming.md) covers the
palette and component overrides.

## How to use this file

1. Find the closest need in the index below.
2. Open that pattern's section and copy its structure, not just its look.
3. Build with the MUI components named there, styled by the theme.
4. If no pattern fits, say so in your summary. Do not invent a layout.

## Index

| Pattern                                | Use it when                                              | Main MUI parts                                      |
| -------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| [Settings shell](#settings-shell)      | Admin or configuration area with several sections        | `Dialog` (full-height), `Stack`, `List`, `ListItemButton` |
| [List with metadata](#list-with-metadata) | Browsing records where each row has a status and facts | `List` or `Table`, `Chip`, `AvatarGroup`, `Typography` |
| [Detail with grouped toggles](#detail-with-grouped-toggles) | Editing a record made of permission- or option-style checkboxes | `Checkbox`, `FormControlLabel`, `Accordion` or collapsible `Box` |
| [Overflow actions](#overflow-actions)  | Secondary actions on a record (duplicate, delete)        | `IconButton`, `Menu`, `MenuItem`                    |
| [Explain a disabled action](#explain-a-disabled-action) | An action is blocked or unavailable              | `Tooltip` on an info icon                           |
| [Confirm destructive action](#confirm-destructive-action) | Deleting or irreversibly changing something           | `Dialog` (small), `Button color="error"`            |
| [Blocked by a dependency](#blocked-by-a-dependency) | An action fails because something else must change first | `Dialog` with warning icon, `Button` that navigates |
| [Create or duplicate sheet](#create-or-duplicate-sheet) | Making a new record, often from an existing one  | `Dialog` or side sheet, `TextField`, sticky footer  |
| [Publish or settings dialog](#publish-or-settings-dialog) | A short labelled form with a choice between options | `Dialog`, `Radio` in choice cards, `Select`, `Button` |
| [Table with tabs and a primary action](#table-with-tabs-and-a-primary-action) | A page of records with views, filters, and one create action | `Tabs`, `Table`, `Button` with icon, `IconButton` |
| [Side panel with tabs](#side-panel-with-tabs) | Secondary settings beside the main content              | `Drawer` (anchor right), `Tabs`, label-left rows    |
| [Checklist with progress](#checklist-with-progress) | Ordered tasks grouped into sections with completion     | `LinearProgress`, `List`, `Chip`                    |
| [Guided conversation](#guided-conversation) | Multi-step setup through questions and answers     | `Stack`, option `Button` grid, `TextField` composer |
| [Empty and waiting states](#empty-and-waiting-states) | Nothing to show yet, or content is being generated | Centered `Stack`, illustration, muted `Typography` |

## Shared rules

These apply to every pattern.

- **One primary action per surface.** The primary button is the charcoal one (the theme's
  `primary`). Secondary actions are outlined or text buttons.
- **Destructive is red and explicit.** Use `color="error"` on the button that deletes, and
  name the verb ("Delete", not "OK"). Cancel sits on the left as a text button.
- **Status is text plus colour.** Pills carry a word ("Live", "Blocked", "Not started"),
  not just a dot. Map meaning to palette roles: success for done or live, warning for in
  progress, error for blocked, neutral outline for not started or draft.
- **Selected controls are blue.** Switches, radios and checked checkboxes use the blue set
  in the theme. Do not restyle them.
- **Sentence case everywhere.** Labels, headings, buttons and menu items. No title case,
  no all-caps labels.
- **Secondary text is muted.** Use `text.secondary` for descriptions, counts and
  timestamps. Titles are `text.primary` and bold.
- **Icons are thin and line-based.** Use one icon set (for example `@mui/icons-material`
  outlined variants) at a consistent size. Do not mix filled and outlined icons on one
  screen.
- **Corners and elevation stay soft.** Rely on the theme's radius and shadows. Do not add
  heavy borders or drop shadows to cards.
- **Explain, don't just disable.** If something is unavailable, show why next to it.

---

## Settings shell

*Reference: roles and permissions screens (two screenshots).*

A wide modal with a light grey left rail and a white content pane. The rail is grouped
under small muted headings (for example **Workspace**, **Setup**, **Account**), and the
active item has a subtle filled background. A close **×** sits at the top right of the
content pane. Nothing in the rail is a link out to another app.

- Rail: `Stack` with small `Typography` group headings, `ListItemButton` items with a
  leading icon. Active item uses `selected`.
- Content header: title on the left, primary action on the right (for example "New role").
- Keep the sections of the rail stable across the app. Do not reorder them per screen.

## List with metadata

*Reference: roles list, features table, checklist rows.*

A row shows a bold name, then muted facts in aligned columns, then a status element, then
a chevron that opens the record. Stacked avatars represent people (users, owners).

- Use a `List` of `ListItemButton` rows for short lists of records with one or two facts.
  Use `Table` when there are more than about five columns or when users sort.
- Put counts and counts-with-noun in the muted column ("20 permissions", "20 users").
- Use `AvatarGroup` for people. Show at most three avatars, then a count.
- Use relative time for recent edits ("10 mins ago") and an absolute date for creation.
- End each row with a chevron icon when the whole row opens the record.
- Show a status `Chip` in the row for the state a user scans for ("Default", "Custom",
  "Live", "Draft"). Use `variant="outlined"` for neutral states and a filled tint for
  states that matter.

## Detail with grouped toggles

*Reference: role detail screen, new-role sheet.*

A record made of many on/off permissions is grouped into collapsible sections. Each
section header is a bold title, a chevron to collapse, and a **Select All** link on the
right. Checkboxes are on the right edge of each row, with the label on the left and an
optional info icon next to the label for explanation.

- Each group is a collapsible block (`Accordion` with no elevation, or a `Box` with a
  toggled body). Header: bold title, chevron, and a text button "Select all" or
  "Deselect all" that reflects the current state.
- Labels come from the data. Do not rewrite them to make them shorter.
- Checkboxes use the theme's blue checked state. Do not override the colour per screen.
- Show the record's name as a large heading with its status chip next to it, and the
  count of users below it as a link-like muted line.

## Overflow actions

*Reference: role detail header.*

Secondary actions (duplicate, delete) live behind a **⋯** icon button at the top right of
the record, not as extra primary buttons. The menu lists the actions in sentence case, and
the destructive one is last and red.

- `IconButton` with `aria-label="More actions"`, opening a `Menu`.
- Destructive `MenuItem` uses `color="error"` text and sits below a divider.

## Explain a disabled action

*Reference: a locked default role with its tooltip.*

When an action can't be taken, the control is still visible, and a small info icon next
to the status explains why. The explanation is a short sentence, and it names the
alternative that *is* available ("This role is a system default and cannot be edited, but
it can be duplicated.").

- Wrap the status element in a `Tooltip` with the sentence. Do not hide the action.
- Keep the copy to one or two sentences. Say what the user can do instead.

## Confirm destructive action

*Reference: delete confirmation.*

A small centred dialog, about 380px wide, with a warning icon, a short question title, a
one-line consequence, then two buttons on a divider. Cancel is a text button on the left;
the destructive button is solid red on the right.

- Title as a question ("Delete role?"). Body says it "cannot be undone" in plain words.
- Use `Dialog` with `maxWidth="xs"`, a `DialogTitle` with the icon, and `DialogActions`.
- Never use the browser `confirm()`. The iframe blocks it. See
  [iframe-constraints.md](iframe-constraints.md).

## Blocked by a dependency

*Reference: "Can't delete role" dialog.*

When an action fails because of another record ("This role is currently assigned to
users"), the dialog says so, names the fix, and offers a button that takes the user to the
place where they can fix it. A warning icon sits at the top left. There is no red button,
because nothing is being destroyed.

- Title states the block ("Can't delete role"). Body explains the fix in two sentences.
- Right button navigates to the blocking list (for example "Go to users"), styled as the
  charcoal primary. Left button is "Cancel".
- Put the record's name or count in the body, not in the title.

## Create or duplicate sheet

*Reference: new role sheet with a copied name.*

Creating from an existing record opens a full-height sheet pre-filled from the source.
The name field is large and at the top, with a placeholder like "Copy of Sales Rep…", and
the record's status chip sits beside it. A sticky footer holds **Cancel** (text, left) and
**Save** (charcoal primary, right, with a save icon).

- Use a `Dialog` at full height or a side `Drawer`. Keep the footer `position: sticky`.
- Pre-fill from the source, and keep the source's grouped toggles as they are.
- The footer stays visible while the grouped content scrolls.

## Publish or settings dialog

*Reference: publish feature dialog.*

A short form in a centred dialog. Each row is a label on the left and a control on the
right. A choice between two options is shown as two selectable **cards**, each with an
icon, a title, and one line of explanation, with a radio in the top right. The footer has
one primary button on the right.

- Label column is fixed-width, so controls align.
- Choice cards: `RadioGroup` with each option wrapped in a bordered `Box`; the selected
  card has the blue radio.
- Keep the form to one screen. If it needs more, use a sheet from the pattern above.

## Table with tabs and a primary action

*Reference: feature list page.*

A page title, then a row of **tabs** under it (with a small icon in the first tab), and a
primary **New** button at the top right with a plus icon. Icon-only buttons for star
(favourite) and view-switch sit next to the primary action. The table has a sortable
header row in muted text, light row dividers, and no zebra striping.

- `Tabs` with an underline indicator, placed under the page title.
- `Table` with `TableHead` in `text.secondary`, sortable headers where the data supports
  it. Sort through the API's sort argument (confirm its name in `graphql-schema://…`), not
  client-side on a full list. See [proxy-and-api.md](proxy-and-api.md).
- Pagination is required. See the rule in SKILL.md ("Tables need pagination").
- Status uses the same `Chip` language as the list pattern.
- Timestamps: relative for recent edits, absolute for created.

## Side panel with tabs

*Reference: side settings panel beside an editor.*

A narrow panel docked to the right edge of an editor. Two tabs at the top ("Build",
"Settings") and label-left rows underneath: **Title**, **Icon**, **Visibility**,
**Navigation**, each with a compact select on the right. Header icons (more, toggle
panel) sit in a thin bar above the tabs.

- `Drawer` with `anchor="right"` and `variant="persistent"` when the editor must stay
  visible, or a fixed `Box` column when the panel is always open.
- Rows are a `Stack` with `direction="row"`, `justifyContent="space-between"`.
- Use `Select` for enumerated values; never a free-text field for a fixed set.

## Checklist with progress

*Reference: onboarding checklist.*

A page title with a subtitle, then a **progress ring or bar** for the whole list, then
sections. Each section has a bold heading, a thin progress bar with a percentage, and rows
with a checkbox-like marker, a title, a muted description, and a status chip on the right
(Done, In progress, Not started, Blocked). A blocked row has a red footer note telling the
user who is fixing it.

- Section progress: `LinearProgress` with `variant="determinate"`. Done fills in success.
- Status chips follow the shared rule: word plus colour.
- The row opens the task with a chevron. Done rows stay in place; do not reorder them.
- For a blocked task, show the explanation and the owner in one line below the row.

## Guided conversation

*Reference: onboarding chat, question cards, reply composer.*

A single centred column. The assistant speaks in a plain bubble, a question sits in a
soft card, and its answers are a two-column grid of outlined option buttons. A composer at
the bottom has a sparkle icon, a placeholder ("Or describe it in your own words…"), a plus
for attachments, and a dark send button. Earlier answers stay visible as right-aligned
muted pills, each with the answerer's avatar, and a muted "Thought for 12s" line marks a
processing step.

- Question card: `Paper` with the question as body text and an options grid of
  `Button variant="outlined"`. Each option is a full answer, not a category.
- Free-text composer: `TextField` with an adornment for the sparkle icon and an
  `IconButton` send.
- Keep the welcome line short and name the outcome ("about 5 minutes").

## Empty and waiting states

*Reference: "Your plan is being written" screen.*

When there is nothing to show yet, or something is being generated, a centred
illustration sits above a heading and a muted one-line hint ("Each answer unlocks the next
piece"). The illustration uses the brand orange as its only accent colour. Nothing else on
the screen is orange.

- Illustrations are the only place the orange accent appears. Do not use it for buttons,
  pills or links.
- Heading in `text.secondary` at a large size; hint in `text.disabled`.
- Use a determinate or indeterminate indicator only if the wait has a known duration.
  Otherwise the illustration is enough.
