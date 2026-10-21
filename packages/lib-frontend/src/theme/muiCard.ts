import { Components, Theme } from "@mui/material/styles"

import { outer } from "./shadows"

// Native cards are outlined (Figma Home cards 16450:66134, record card 22707:3912): paper fill,
// a 1px 10% border, the outer/sm shadow and paper/border-radius/md (16). A nested card or small
// tile inside another surface uses paper/border-radius/sm: `<Card sx={{ borderRadius: "12px" }}>`.
export const muiCard = (): Components<Omit<Theme, "components">>["MuiCard"] => ({
  defaultProps: {
    variant: "outlined",
  },
  styleOverrides: {
    root: ({ theme }) => ({
      borderRadius: 16,
      borderColor: theme.palette.border.strong,
      backgroundColor: theme.palette.background.paper,
      backgroundImage: "none",
      boxShadow: outer.sm,
    }),
  },
})
