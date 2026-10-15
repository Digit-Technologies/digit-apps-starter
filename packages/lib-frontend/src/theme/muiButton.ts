import { Components, Theme } from "@mui/material/styles"

import { isDarkMode } from "./helpers/isDarkMode"
import { isLightMode } from "./helpers/isLightMode"

import {
  blue,
  neutral,
  neutralAlpha,
  red,
  stone,
  transparent,
} from "./colors"
import { outer, inner } from "./shadows"

const commonContainedSecondaryLightStyles = {
  border: `1px solid ${neutralAlpha.darken[100]}`,
  boxShadow: outer.sm,
  color: neutralAlpha.darken[950],
}
const commonContainedSecondaryDarkStyles = {
  border: `1px solid ${neutralAlpha.lighten[100]}`,
  boxShadow: outer.sm,
  color: neutral.white,
}
const commonFocusLightStyles = {
  boxShadow: "none",
  outline: `2px solid ${blue[600]}`,
  outlineOffset: "2px",
}
const commonFocusDarkStyles = {
  outline: `2px solid ${blue[400]}`,
  outlineOffset: "2px",
}

export const muiButton = (): Components<
  Omit<Theme, "components">
>["MuiButton"] => {
  return {
    styleOverrides: {
      root: {
        borderRadius: "10px",
        // Buttons size to their label. MUI's 64px minimum adds dead space to short labels like "Next".
        minWidth: 0,
        fontSize: "13px",
        padding: "8px 12px",
        "&.Mui-disabled .MuiButton-startIcon, &.Mui-disabled .MuiButton-endIcon":
          {
            color: "inherit",
          },
        "&.Mui-disabled .MuiButton-startIcon > *, &.Mui-disabled .MuiButton-endIcon > *":
          {
            color: "inherit",
            stroke: "currentColor",
          },
      },
      startIcon: {
        marginRight: "4px",
      },
      endIcon: {
        marginLeft: "4px",
      },
      sizeXs: {
        borderRadius: "6px",
        fontSize: "13px",
        minHeight: "20px",
        padding: "0 4px",
        gap: "2px",
      },
      sizeSmall: {
        borderRadius: "8px",
        fontSize: "13px",
        minHeight: "28px",
        padding: "0 8px",
        gap: "4px",
        "@media (max-width: 599px)": {
          minHeight: "35px",
          padding: "0 10px",
        },
      },
      sizeMedium: {
        borderRadius: "10px",
        fontSize: "13px",
        minHeight: "36px",
        padding: "8px 12px",
        gap: "6px",
        "@media (max-width: 599px)": {
          minHeight: "45px",
          padding: "0 15px",
        },
      },
      sizeLarge: {
        gap: "8px",
      },
      outlined: ({ theme }) => ({
        ...(isLightMode(theme) && {
          backgroundColor: neutralAlpha.darken[50],
          borderColor: transparent,
          color: stone[950],
          "&:hover": {
            backgroundColor: neutralAlpha.darken[100],
            borderColor: transparent,
          },
          "&:active": {
            backgroundColor: neutralAlpha.darken[150],
            borderColor: transparent,
          },
          "&:disabled": {
            backgroundColor: neutralAlpha.darken[50],
            borderColor: transparent,
            color: stone[350],
          },
          "&:focus-visible": {
            backgroundColor: neutralAlpha.darken[50],
            borderColor: transparent,
            ...commonFocusLightStyles,
          },
        }),
        ...(isDarkMode(theme) && {
          backgroundColor: neutralAlpha.lighten[150],
          borderColor: transparent,
          color: neutral.white,
          "&:hover": {
            backgroundColor: neutralAlpha.lighten[100],
            borderColor: transparent,
          },
          "&:active": {
            backgroundColor: neutralAlpha.lighten[50],
            borderColor: transparent,
          },
          "&:disabled": {
            backgroundColor: neutralAlpha.lighten[50],
            borderColor: transparent,
            color: stone[350],
          },
          "&:focus-visible": {
            borderColor: transparent,
            ...commonFocusDarkStyles,
          },
        }),
      }),
      text: ({ theme }) => ({
        ...(isLightMode(theme) && {
          color: stone[950],
          borderColor: transparent,
          "&:hover": {
            backgroundColor: neutralAlpha.darken[50],
            borderColor: transparent,
          },
          "&:active": {
            backgroundColor: neutralAlpha.darken[100],
            borderColor: transparent,
          },
          "&:disabled": {
            color: stone[350],
            borderColor: transparent,
          },
          "&:focus-visible": {
            backgroundColor: neutralAlpha.darken[50],
            borderColor: transparent,
            ...commonFocusLightStyles,
          },
        }),
        ...(isDarkMode(theme) && {
          color: neutral.white,
          "&:hover": {
            backgroundColor: neutralAlpha.lighten[100],
            borderColor: transparent,
          },
          "&:active": {
            backgroundColor: neutralAlpha.lighten[50],
            borderColor: transparent,
          },
          "&:disabled": {
            backgroundColor: stone[600],
            borderColor: transparent,
            color: stone[350],
          },
          "&:focus-visible": {
            backgroundColor: stone[600],
            borderColor: transparent,
            ...commonFocusDarkStyles,
          },
        }),
      }),
    },
    variants: [
      {
        props: { variant: "contained", color: "primary" },
        style: ({ theme }) => ({
          ...(isLightMode(theme) && {
            backgroundColor: stone[700],
            border: `1px solid ${neutralAlpha.darken[100]}`,
            boxShadow: outer.sm,
            color: "white",
            "&:hover": {
              backgroundColor: stone[800],
              boxShadow: outer.sm,
              color: "white",
            },
            "&:active": {
              backgroundColor: stone[900],
              boxShadow: inner.sm,
              color: "white",
            },
            "&:disabled": {
              backgroundColor: stone[400],
              color: stone[200],
            },
            "&:focus-visible": {
              backgroundColor: stone[700],
              color: "white",
              ...commonFocusLightStyles,
            },
          }),
          ...(isDarkMode(theme) && {
            backgroundColor: stone[100],
            color: stone[950],
            "&:hover": {
              backgroundColor: stone[200],
              color: stone[950],
            },
            "&:active": {
              backgroundColor: stone[300],
              color: stone[950],
            },
            "&:disabled": {
              backgroundColor: stone[400],
              color: stone[950],
            },
            "&:focus-visible": {
              backgroundColor: stone[100],
              color: stone[950],
              ...commonFocusDarkStyles,
            },
          }),
        }),
      },
      {
        // Destructive confirm. Keeps the primary fill and shape, and shifts to red on hover and press.
        props: { variant: "contained", color: "error" },
        style: ({ theme }) => ({
          ...(isLightMode(theme) && {
            backgroundColor: stone[700],
            border: `1px solid ${neutralAlpha.darken[100]}`,
            boxShadow: outer.sm,
            color: "white",
            "&:hover": {
              backgroundColor: red[800],
              boxShadow: outer.sm,
              color: "white",
            },
            "&:active": {
              backgroundColor: red[850],
              boxShadow: inner.sm,
              color: "white",
            },
            "&:disabled": {
              backgroundColor: stone[400],
              color: stone[350],
            },
            "&:focus-visible": {
              backgroundColor: stone[700],
              color: "white",
              ...commonFocusLightStyles,
            },
          }),
        }),
      },
      {
        props: { variant: "outlined", color: "error" },
        style: ({ theme }) => ({
          ...(isLightMode(theme) && {
            color: red[600],
            "&:hover": {
              backgroundColor: red[50],
              color: red[600],
            },
            "&:active": {
              backgroundColor: red[100],
              color: red[600],
            },
          }),
        }),
      },
      {
        props: { variant: "text", color: "error" },
        style: ({ theme }) => ({
          ...(isLightMode(theme) && {
            color: red[600],
            "&:hover": {
              backgroundColor: red[50],
              color: red[600],
            },
            "&:active": {
              backgroundColor: red[100],
              color: red[600],
            },
          }),
        }),
      },
      {
        props: { variant: "contained", color: "secondary" },
        style: ({ theme }) => ({
          ...(isLightMode(theme) && {
            backgroundColor: neutral.white,
            ...commonContainedSecondaryLightStyles,
            "&:hover": {
              backgroundColor: stone[50],
              ...commonContainedSecondaryLightStyles,
            },
            "&:active": {
              backgroundColor: stone[100],
              ...commonContainedSecondaryLightStyles,
              boxShadow: inner.sm,
            },
            "&:disabled": {
              backgroundColor: neutral.white,
              ...commonContainedSecondaryLightStyles,
              color: stone[350],
            },
            "&:focus-visible": {
              backgroundColor: neutral.white,
              ...commonContainedSecondaryLightStyles,
              ...commonFocusLightStyles,
            },
          }),
          ...(isDarkMode(theme) && {
            backgroundColor: stone[600],
            ...commonContainedSecondaryDarkStyles,
            "&:hover": {
              backgroundColor: stone[650],
              ...commonContainedSecondaryDarkStyles,
            },
            "&:active": {
              backgroundColor: stone[700],
              ...commonContainedSecondaryDarkStyles,
              boxShadow: inner.sm,
            },
            "&:disabled": {
              backgroundColor: stone[600],
              ...commonContainedSecondaryDarkStyles,
              color: stone[350],
            },
            "&:focus-visible": {
              backgroundColor: stone[600],
              ...commonContainedSecondaryDarkStyles,
              ...commonFocusDarkStyles,
            },
          }),
        }),
      },
    ],
    defaultProps: {
      color: "secondary",
      size: "small",
      variant: "contained",
      disableRipple: true,
      // Native buttons sit flat. Their depth comes from the outer shadow in the variants above.
      disableElevation: true,
    },
  }
}
