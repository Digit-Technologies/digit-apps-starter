import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors.js"
import { focusColor } from "./focus.js"

// Figma Atoms › Tab (spec 2.16). A tab has no horizontal padding, so the underline is as wide as
// the label. The tab is 36 tall with a 28px content row at the top. Every size is in spacing
// units, so the tab grows to 45 on mobile.
export const muiTab = (): Components<Omit<Theme, "components">>["MuiTab"] => ({
  defaultProps: {
    disableRipple: true,
    iconPosition: "start",
  },
  styleOverrides: {
    root: ({ theme }) => {
      const dark = theme.palette.mode === "dark"
      return {
        ...theme.typography.button,
        position: "relative",
        // MUI clamps tabs to 90-360px, which stretches short labels.
        minWidth: 0,
        maxWidth: "none",
        minHeight: theme.spacing(4.5),
        height: theme.spacing(4.5),
        // 6 + 16 + 6 = the 28px content row, then 8px down to the underline.
        padding: theme.spacing(0.75, 0, 1.75),
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: theme.spacing(0.5),
        // The focus ring sits 2px outside the content box.
        overflow: "visible",
        color: theme.palette.text.secondary,
        opacity: 1,
        "& > .MuiTab-icon, & > svg": {
          margin: 0,
          flexShrink: 0,
          width: theme.spacing(2),
          height: theme.spacing(2),
        },
        // Hover and pressed tint a per-tab underline. The selected underline is the indicator.
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          backgroundColor: "transparent",
        },
        "&:hover::after": {
          backgroundColor: dark ? neutralAlpha.lighten[100] : neutralAlpha.darken[50],
        },
        "&:active": {
          color: theme.palette.text.primary,
        },
        "&:active::after": {
          backgroundColor: dark ? neutralAlpha.lighten[50] : neutralAlpha.darken[100],
        },
        "&.Mui-selected": {
          color: theme.palette.text.primary,
        },
        "&.Mui-disabled": {
          color: theme.palette.text.tertiary,
        },
        // Figma tab/outline/focus: a 2px ring round the 28px content box, radius 8, inset -2.
        "&.Mui-focusVisible::before": {
          content: '""',
          position: "absolute",
          top: -2,
          left: -2,
          right: -2,
          height: `calc(${theme.spacing(3.5)} + 4px)`,
          border: `2px solid ${focusColor(theme)}`,
          borderRadius: 8,
          pointerEvents: "none",
        },
      }
    },
  },
})

export const muiTabs = (): Components<Omit<Theme, "components">>["MuiTabs"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        // Figma paper/border/alpha/strong. A header that holds the tabs (PageHeader, Modal) draws
        // its own line instead and turns this one off.
        borderBottom: `1px solid ${theme.palette.border.strong}`,
        minHeight: theme.spacing(4.5),
        width: "100%",
        // The tab focus ring reaches 2px past the tab, so fixed tab lists must not clip it.
        overflow: "visible",
      }),
      scroller: {
        "&.MuiTabs-fixed": {
          overflow: "visible !important",
        },
      },
      list: ({ theme }) => ({
        gap: theme.spacing(2),
      }),
      indicator: ({ theme }) => ({
        height: 2,
        backgroundColor: theme.palette.text.primary,
        transition: "none",
      }),
    },
  }
}
