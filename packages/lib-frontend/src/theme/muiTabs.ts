import { Components, Theme } from "@mui/material/styles"

export const muiTab = (): Components<Omit<Theme, "components">>["MuiTab"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      minHeight: theme.spacing(4.5),
      padding: theme.spacing(0, 1),
      fontSize: "13px",
      fontWeight: 500,
      lineHeight: "20px",
      textTransform: "none",
      color: theme.palette.text.secondary,
      "&.Mui-selected": {
        color: theme.palette.text.primary,
      },
    }),
  },
})

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
