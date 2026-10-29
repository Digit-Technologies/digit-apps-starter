import { CSSObject, Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors.js"

/** Figma listitembutton/background: hover a.05 / w.10, pressed a.10 / w.05. */
export const menuItemBackgrounds = (theme: Theme) => {
  const dark = theme.palette.mode === "dark"
  return {
    hover: dark ? neutralAlpha.lighten[100] : neutralAlpha.darken[50],
    pressed: dark ? neutralAlpha.lighten[50] : neutralAlpha.darken[100],
  }
}

// Figma Molecules › Menu › MenuItemButton: min height 28, py 6, px 8, radius 8, a 16px icon with
// a 4px gap, and the label in button/Sm 13/16 500. Shared with the Autocomplete options.
export const menuItemStyles = (theme: Theme): CSSObject => {
  const bg = menuItemBackgrounds(theme)
  return {
    ...theme.typography.button,
    color: theme.palette.text.primary,
    minHeight: theme.spacing(3.5),
    padding: theme.spacing(0.75, 1),
    margin: 0,
    gap: theme.spacing(0.5),
    borderRadius: theme.spacing(1),
    "&:hover, &.Mui-focusVisible, &.Mui-focused": {
      backgroundColor: bg.hover,
    },
    "&:active": {
      backgroundColor: bg.pressed,
    },
    "&.Mui-selected, &[aria-selected='true']": {
      backgroundColor: bg.hover,
      "&:hover, &.Mui-focusVisible, &.Mui-focused": {
        backgroundColor: bg.hover,
      },
    },
    "&.Mui-disabled, &[aria-disabled='true']": {
      opacity: 1,
      color: theme.palette.text.tertiary,
    },
  }
}

export const muiMenuItem = (): Components<
  Omit<Theme, "components">
>["MuiMenuItem"] => {
  return {
    defaultProps: {
      disableRipple: true,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        ...menuItemStyles(theme),
        // An item with a subtitle keeps its icon on the label row.
        "&:has(.MuiListItemText-multiline)": {
          alignItems: "flex-start",
        },
        // MUI reserves 36px for the icon. Figma sizes it to the 16px glyph plus the 4px gap.
        "& .MuiListItemIcon-root": {
          minWidth: 0,
        },
        "& .MuiListItemText-inset": {
          paddingLeft: theme.spacing(2.5),
        },
        // Figma subtitle: 8px below the label row.
        "& .MuiListItemText-root .MuiListItemText-secondary": {
          marginTop: theme.spacing(1),
        },
        "& + .MuiDivider-root": {
          margin: theme.spacing(0, -0.5),
        },
      }),
    },
  }
}
