import { Components, Theme } from "@mui/material/styles"

// Lead and trail slots of a field (spec 2.14): 16px icons and 13/16 text in the field colour. The
// field root spaces them with its size's gap, so MUI's 8px margins and the filled variant's
// floating-label offset are removed.
export const muiInputAdornment = (): Components<
  Omit<Theme, "components">
>["MuiInputAdornment"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      height: "auto",
      maxHeight: "none",
      color: "inherit",
      // Four classes beat MUI's filled start-adornment offset rule.
      "&&&&": { margin: 0 },
      "& svg": {
        width: theme.spacing(2),
        height: theme.spacing(2),
        flexShrink: 0,
      },
      "& .MuiTypography-root": {
        ...theme.typography.body1,
        color: "inherit",
      },
    }),
  },
})
