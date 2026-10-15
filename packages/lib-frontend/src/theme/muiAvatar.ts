import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors"

// Avatars sit on the paper surface with a 1px strong border. People are round, and everything
// else is a rounded square, as on the platform.
export const muiAvatar = (): Components<Omit<Theme, "components">>["MuiAvatar"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      border: `1px solid ${theme.palette.border.strong}`,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.secondary,
      fontSize: "12px",
      fontWeight: 500,
      lineHeight: 1,
    }),
    circular: { borderRadius: "50%" },
    rounded: ({ theme }) => ({ borderRadius: theme.spacing(0.75) }),
  },
})
