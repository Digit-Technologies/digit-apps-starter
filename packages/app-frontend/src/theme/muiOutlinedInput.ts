import { Components, Theme } from "@mui/material/styles"

import { inputHoverFillColor } from "./inputHoverFill"

export const muiOutlinedInput = (): Components<
  Omit<Theme, "components">
>["MuiOutlinedInput"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: "8px",
        // Hover fill marks fields the user can type into. Disabled and
        // read-only fields aren't editable; selects are picked, not typed.
        "&:hover:not(.Mui-disabled):not(.Mui-readOnly):not(:has(.MuiSelect-select))":
          {
            backgroundColor: inputHoverFillColor(theme),
          },
      }),
      input: ({ theme }) => ({
        fontSize: theme.typography.body1.fontSize,
        lineHeight: theme.typography.body1.lineHeight,
      }),
    },
  }
}
