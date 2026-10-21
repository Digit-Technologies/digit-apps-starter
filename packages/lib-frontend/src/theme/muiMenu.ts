import { Components, Theme } from "@mui/material/styles"

import { outer } from "./shadows"

// Figma Molecules › Menu (10411:22075). The paper uses the solid strong border, radius 10 and
// outer/md. The list pads 4px all round and puts a 4px gap between items.
export const menuPaperStyles = (theme: Theme) => ({
  backgroundColor: theme.palette.background.paper,
  backgroundImage: "none",
  border: `1px solid ${theme.palette.border.solidStrong}`,
  borderRadius: theme.spacing(1.25),
  boxShadow: outer.md,
})

export const menuListStyles = (theme: Theme) => ({
  display: "flex",
  flexDirection: "column" as const,
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  // MenuList writes an inline paddingRight (the scrollbar width, often 0) when the list scrolls.
  paddingRight: `${theme.spacing(0.5)} !important`,
  // A divider is a full-bleed 1px line. The item gap gives it 4px of space above and below.
  "& > .MuiDivider-root": {
    margin: theme.spacing(0, -0.5),
  },
})

export const muiMenu = (): Components<Omit<Theme, "components">>["MuiMenu"] => {
  return {
    defaultProps: {
      // digit-web passes BackdropProps. MUI 9 removed that prop; slotProps.backdrop
      // is the same invisible menu backdrop.
      slotProps: {
        backdrop: {
          invisible: true,
        },
      },
    },
    styleOverrides: {
      root: {
        // The page is not dimmed behind a menu.
        "& .MuiBackdrop-root": {
          backgroundColor: "transparent",
          backdropFilter: "none",
        },
      },
      paper: ({ theme }) => menuPaperStyles(theme),
      list: ({ theme }) => menuListStyles(theme),
    },
  }
}
