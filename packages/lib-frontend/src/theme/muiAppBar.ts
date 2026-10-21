import { Components, Theme } from "@mui/material/styles"

// Figma appBar (11800:69168) is the page header, not a coloured Material bar: page background,
// primary text, the solid strong bottom line and no shadow. Prefer `PageHeader`; this keeps a
// stray MUI AppBar from looking like default MUI. `darkMode` is kept for the existing call site.
export const muiAppBar = (_options: {
  darkMode: boolean
}): Components<Omit<Theme, "components">>["MuiAppBar"] => {
  return {
    defaultProps: {
      elevation: 0,
      position: "static",
    },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.default,
        backgroundImage: "none",
        color: theme.palette.text.primary,
        boxShadow: "none",
        borderBottom: `1px solid ${theme.palette.border.solidStrong}`,
        // A Toolbar inside matches the 60px header bar with the 36px page gutter (20px below 600px).
        "& .MuiToolbar-root": {
          minHeight: 60,
          gap: theme.spacing(1),
          paddingLeft: 36,
          paddingRight: 36,
          "@media (max-width: 599px)": { paddingLeft: 20, paddingRight: 20 },
        },
      }),
      colorPrimary: ({ theme }) => ({
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }),
    },
  }
}
