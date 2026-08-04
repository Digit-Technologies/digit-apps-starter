import { Components, Theme } from "@mui/material/styles"

export const muiTabs = (): Components<Omit<Theme, "components">>["MuiTabs"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        alignItems: "center",
        borderBottom: `1px solid ${theme.palette.border.default}`,
        height: theme.spacing(4.5),
        mb: 0,
        minHeight: theme.spacing(4.5),
        mt: 0,
        transition: "none",
        width: "100%",
      }),
    },
  }
}
