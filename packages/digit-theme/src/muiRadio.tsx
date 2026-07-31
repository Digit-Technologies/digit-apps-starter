import React from "react"

import SvgIcon from "@mui/material/SvgIcon"
import { Components, Theme } from "@mui/material/styles"

import { neutralAlpha, blue, stone, neutral } from "./colors"
import { outer } from "./shadows"
import { getThemeExtensions } from "./theme-extensions"
import { defaultTransition } from "./transitions"

// Empty checked icon - removes the checked icon completely
const CustomCheckedIcon = () => (
  <SvgIcon viewBox="0 0 8 8">
    <path
      d="M4 8C6.20914 8 8 6.20914 8 4C8 1.79086 6.20914 0 4 0C1.79086 0 0 1.79086 0 4C0 6.20914 1.79086 8 4 8Z"
      fill="white"
    />
  </SvgIcon>
)

// Empty unchecked icon - removes the unchecked icon completely
const EmptyUncheckedIcon = () => (
  <SvgIcon viewBox="0 0 0 0">{/* Empty - no icon content */}</SvgIcon>
)

export const muiRadio = (
  darkMode: boolean,
): Components<Omit<Theme, "components">>["MuiRadio"] => {
  const extensions = getThemeExtensions(darkMode)

  return {
    defaultProps: {
      disableRipple: true,
      icon: <EmptyUncheckedIcon />,
      checkedIcon: <CustomCheckedIcon />,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: `${theme.spacing(2)}!important`,
        width: `${theme.spacing(2)}!important`,
        height: `${theme.spacing(2)}!important`,
        border: `1px solid ${neutralAlpha.darken[200]}`,
        boxShadow: outer.sm,
        background: neutral.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: neutral.white,
        padding: 0,
        transition: defaultTransition(theme),
        ...(darkMode && {
          color: neutralAlpha.lighten[200],
          "&.Mui-disabled": {
            color: stone[750],
          },
        }),

        "& input": {
          width: "100%",
          height: "100%",
        },

        "&.Mui-focusVisible": {
          outline: `2px auto ${extensions.tabFocus}`,
          outlineOffset: 2,
        },

        "& .MuiSvgIcon-root": {
          display: "none",
          visibility: "hidden",
        },

        "&.Mui-disabled": {
          color: stone[50],
        },

        "&:hover": {
          background: stone[50],
          border: `1px solid ${neutralAlpha.darken[200]}`,
          ...theme.applyStyles("dark", {
            background: stone[650],
          }),
        },

        "&:active": {
          background: stone[100],
          ...theme.applyStyles("dark", {
            background: neutral[700],
          }),
        },

        "&:disabled ~ &": {
          boxShadow: "none",
          background: stone[50],
          border: `1px solid ${neutralAlpha.darken[50]}`,
          ...theme.applyStyles("dark", {
            border: `1px solid ${neutralAlpha.lighten[50]}`,
            background: stone[750],
          }),
        },

        "&.Mui-checked": {
          background: blue[500],
          color: neutral.white,
          outline: "none",
          ...theme.applyStyles("dark", {
            background: blue[600],
          }),

          "& .MuiSvgIcon-root": {
            display: "block",
            visibility: "visible",
            width: theme.spacing(1),
            height: theme.spacing(1),
            borderRadius: theme.spacing(1),
            color: neutral.white,
            boxShadow: outer.sm,
            outline: `1px solid ${theme.palette.border.strong}`,

            // Scale up inner dot on small viewports
            [theme.breakpoints.down("sm")]: {
              width: theme.spacing(1.75), // 1 * 1.75
              height: theme.spacing(1.75), // 1 * 1.75
              borderRadius: theme.spacing(1.75), // 1 * 1.75
            },
          },

          "&:hover": {
            background: blue[550],
            ...theme.applyStyles("dark", {
              background: blue[650],
            }),
          },
          "&:active": {
            background: blue[600],
            ...theme.applyStyles("dark", {
              background: blue[700],
            }),
          },
          "&:disabled": {
            background: blue[50],
            ...theme.applyStyles("dark", {
              background: blue[750],
            }),
          },
        },

        // Scale up on small viewports
        [theme.breakpoints.down("sm")]: {
          width: `${theme.spacing(3.5)}!important`, // 2 * 1.75
          height: `${theme.spacing(3.5)}!important`, // 2 * 1.75
          borderRadius: `${theme.spacing(3.5)}!important`, // 2 * 1.75
        },
      }),
    },
  }
}
