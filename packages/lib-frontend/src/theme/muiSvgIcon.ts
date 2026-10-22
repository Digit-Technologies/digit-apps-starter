import { Components, Theme } from "@mui/material/styles"

// Figma icon/size/default (Icon, 10380:23097): sm 16, md 20 (the default), lg 28, in
// theme-spacing units so they grow ×1.25 below 600px. MUI's own 20 / 24 / 35 would make every
// MUI glyph one step larger than the Lucide icons beside it. Controls that size their own icons
// (buttons, inputs, alerts) still win, as their selectors are more specific.
export const muiSvgIcon = (): Components<Omit<Theme, "components">>["MuiSvgIcon"] => ({
  styleOverrides: {
    fontSizeSmall: ({ theme }) => ({ fontSize: theme.spacing(2) }),
    fontSizeMedium: ({ theme }) => ({ fontSize: theme.spacing(2.5) }),
    fontSizeLarge: ({ theme }) => ({ fontSize: theme.spacing(3.5) }),
  },
})
