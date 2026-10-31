import { Components, Theme } from "@mui/material/styles"

import { fieldInputStyles, fieldRootStyles } from "./muiFilledInput.js"

// Figma has no stroked field: its "Outlined" field is the grey filled one. variant="outlined"
// renders that same field, so a TextField or Select written without a variant (or with MUI's
// default outlined one) still matches the design. The notched outline is hidden.
export const muiOutlinedInput = (): Components<
  Omit<Theme, "components">
>["MuiOutlinedInput"] => ({
  styleOverrides: {
    root: ({ ownerState, theme }) => fieldRootStyles(theme, ownerState, "filled"),
    input: ({ ownerState, theme }) => fieldInputStyles(theme, ownerState),
    notchedOutline: {
      display: "none",
    },
  },
})
