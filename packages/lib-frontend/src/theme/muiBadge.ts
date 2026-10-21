import { Components, Theme } from "@mui/material/styles"

import { accentScales } from "./accent-colors"

// Count badges on tabs and buttons: a small grey pill, sized to its number, that sits inline after
// the label. Use <Badge variant="count" badgeContent={3}>Label</Badge>. The standard and dot
// variants keep MUI's corner overlay.
export const muiBadge = (): Components<Omit<Theme, "components">>["MuiBadge"] => ({
  styleOverrides: {
    badge: {
      fontSize: "11px",
      fontWeight: 500,
    },
  },
  variants: [
    {
      props: { variant: "count" },
      style: ({ theme }) => ({
        alignItems: "center",
        "& .MuiBadge-badge": {
          position: "static",
          marginLeft: theme.spacing(0.5),
          transform: "none",
          height: 18,
          minWidth: 18,
          padding: "0 5px",
          borderRadius: "6px",
          lineHeight: "18px",
          color: theme.palette.text.primary,
          backgroundColor: accentScales.stone[250],
          ...theme.applyStyles("dark", {
            backgroundColor: accentScales.stone[750],
          }),
        },
        "& .MuiBadge-invisible": {
          display: "none",
        },
      }),
    },
  ],
})
