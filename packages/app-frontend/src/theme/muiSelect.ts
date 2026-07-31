import { Components, Theme } from "@mui/material/styles"

export const muiSelect = (): Components<
  Omit<Theme, "components">
>["MuiSelect"] => {
  return {
    styleOverrides: {
      select: ({ theme }) => ({
        fontSize: theme.typography.body1.fontSize,
        lineHeight: theme.typography.body1.lineHeight,
      }),
    },
  }
}
