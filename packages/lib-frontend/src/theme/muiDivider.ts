import { Components, Theme } from "@mui/material/styles"

// Figma Divider/Set is drawn in paper/border/solid/strong (#e5e5e5 / #525252) in both modes.
export const muiDivider = (): Components<
  Omit<Theme, "components">
>["MuiDivider"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        borderColor: theme.palette.border.solidStrong,
      }),
    },
  }
}
