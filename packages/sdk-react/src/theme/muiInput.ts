import { Components, Theme } from "@mui/material/styles"

import { fieldInputStyles, fieldRootStyles } from "./muiFilledInput.js"

// variant="standard" is Figma's "Invisible" field (spec 2.14): no fill and no underline until hover,
// with the same sizes, padding and radius as the filled field, so its text sits 8px in from the
// edge. Used by `<Select variant="standard">` for selects that read as text with a chevron, and by
// `<TextField variant="standard">` for display fields.
export const muiInput = (): Components<Omit<Theme, "components">>["MuiInput"] => ({
  defaultProps: {
    disableUnderline: true,
  },
  styleOverrides: {
    root: ({ ownerState, theme }) => ({
      ...fieldRootStyles(theme, ownerState, "invisible"),
      // MUI leaves room above a standard input for a floating label. Labels sit outside the field.
      "label + &": { marginTop: 0 },
    }),
    input: ({ ownerState, theme }) => fieldInputStyles(theme, ownerState),
  },
})
