/*
Form field sizes (Figma Input / Select / Textarea, spec 2.14). One geometry for every variant:

| `size` prop                        | Figma | Height | Padding-x | Gap | Radius |
|------------------------------------|-------|--------|-----------|-----|--------|
| "xs"                               | xs    | 20     | 4         | 2   | 6      |
| "small", "medium" or unset (default) | sm  | 28     | 8         | 4   | 8      |
| "large"                            | md    | 36     | 12        | 6   | 10     |

Both MUI sizes render Figma sm, so `<TextField hiddenLabel>`, `<TextField size="small">`, a bare
`<Select>` and a `<FormControl>` (MUI's default size is medium) all give the same 28px field. xs and
md are opt-in through the extra "xs" and "large" sizes. Multiline fields ignore the size: Figma's
textarea is padding 8, radius 10. Values are theme-spacing multiples, so they scale ×1.25 on mobile.

Variants: FilledInput (variant="filled", the TextField default) and OutlinedInput
(variant="outlined") both draw Figma's "Outlined" grey field. Input (variant="standard") draws
Figma's "Invisible" field, transparent until hover. See muiInput.ts and muiOutlinedInput.ts.
*/
import { CSSObject, Components, Theme } from "@mui/material/styles"

import { focusColor } from "./focus"
import { fieldColors } from "./inputHoverFill"

type FieldMetrics = { height: number; px: number; gap: number; radius: number }

// In theme-spacing units (8px desktop, 10px mobile).
const fieldMetrics: Record<"xs" | "sm" | "md", FieldMetrics> = {
  xs: { height: 2.5, px: 0.5, gap: 0.25, radius: 0.75 },
  sm: { height: 3.5, px: 1, gap: 0.5, radius: 1 },
  md: { height: 4.5, px: 1.5, gap: 0.75, radius: 1.25 },
}

/** Maps an input's `size` prop to a Figma field size (see the table at the top of this file). */
export const fieldSize = (size: unknown): FieldMetrics => {
  if (size === "xs") return fieldMetrics.xs
  if (size === "large") return fieldMetrics.md
  return fieldMetrics.sm
}

type FieldOwnerState = { size?: unknown; multiline?: boolean }

/**
 * The geometry and states shared by every field variant. `look` picks the fill: "filled" is the
 * grey Figma "Outlined" field, "invisible" is transparent until hover. Focus draws a 1px inset
 * border in focusColor, error a 1px error.main border, and disabled keeps the fill (none for
 * invisible) while the content fades to 30%.
 */
export const fieldRootStyles = (
  theme: Theme,
  ownerState: FieldOwnerState,
  look: "filled" | "invisible",
): CSSObject => {
  const colors = fieldColors(theme)
  const m = fieldSize(ownerState.size)
  const rest = look === "filled" ? colors.fill : "transparent"
  const hover = look === "filled" ? colors.hoverFill : colors.invisibleHoverFill
  const disabled = look === "filled" ? colors.disabledFill : "transparent"

  return {
    // Select reads these to place its chevron, whatever the size.
    "--digit-field-px": theme.spacing(m.px),
    "--digit-field-gap": theme.spacing(m.gap),
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    gap: theme.spacing(m.gap),
    backgroundColor: rest,
    ...(ownerState.multiline
      ? { padding: theme.spacing(1), borderRadius: theme.spacing(1.25), alignItems: "flex-start" }
      : {
          padding: theme.spacing(0, m.px),
          minHeight: theme.spacing(m.height),
          borderRadius: theme.spacing(m.radius),
        }),
    "&:hover": { backgroundColor: hover },
    // Figma "active": the field keeps the hover fill while it has focus.
    "&.Mui-focused": { backgroundColor: hover },
    // The focusable element is the inner input, so :has() reaches it from the root.
    "&:has(input:focus-visible, textarea:focus-visible, [role='combobox']:focus-visible)": {
      boxShadow: `0 0 0 1px ${focusColor(theme)} inset`,
    },
    "&.Mui-error": {
      boxShadow: `0 0 0 1px ${theme.palette.error.main} inset`,
    },
    "&.Mui-disabled": {
      backgroundColor: disabled,
      "& .MuiInputBase-input, & .MuiInputAdornment-root, & .MuiSelect-icon": {
        opacity: theme.palette.opacity.disabled,
      },
      // MUI greys the text out instead. The opacity above does that job.
      "& .MuiInputBase-input.Mui-disabled": {
        color: theme.palette.text.primary,
        WebkitTextFillColor: theme.palette.text.primary,
      },
    },
  }
}

/** The text element inside a field: 13/16 input text, padded to the field height. */
export const fieldInputStyles = (theme: Theme, ownerState: FieldOwnerState): CSSObject => {
  const colors = fieldColors(theme)
  const m = fieldSize(ownerState.size)
  return {
    ...theme.typography.body1,
    height: ownerState.multiline ? undefined : theme.spacing(2),
    padding: ownerState.multiline ? 0 : theme.spacing((m.height - 2) / 2, 0),
    "&::placeholder": {
      color: colors.placeholder,
      opacity: 1,
    },
    "&::selection": {
      backgroundColor: colors.selection,
    },
  }
}

export const muiFilledInput = (): Components<Omit<Theme, "components">>["MuiFilledInput"] => ({
  defaultProps: {
    disableUnderline: true,
  },
  styleOverrides: {
    root: ({ ownerState, theme }) => fieldRootStyles(theme, ownerState, "filled"),
    input: ({ ownerState, theme }) => fieldInputStyles(theme, ownerState),
  },
})
