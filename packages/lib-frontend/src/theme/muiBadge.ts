import { Components, Theme } from "@mui/material/styles"

import { accentScales } from "./accent-colors"

// Count badges on tabs and buttons: a small grey pill, sized to its number.
export const muiBadge = (): Components<Omit<Theme, "components">>["MuiBadge"] => ({
  styleOverrides: {
    badge: ({ theme }) => {
      const isDark = theme.palette.mode === "dark"
      return {
        position: "static",
        marginLeft: theme.spacing(0.5),
        transform: "none",
        height: 18,
        minWidth: 18,
        padding: "0 5px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 500,
        lineHeight: "18px",
        color: theme.palette.text.primary,
        backgroundColor: isDark ? accentScales.stone[750] : accentScales.stone[250],
      }
    },
  },
})
