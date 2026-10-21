import React from "react"

import SvgIcon from "@mui/material/SvgIcon"
import { Components, Theme } from "@mui/material/styles"

import { blue, neutral, neutralAlpha, stone } from "./colors"
import { focusColor } from "./focus"
import { inner, outer } from "./shadows"
import { defaultTransition } from "./transitions"

// The root span is the 16px circle, so the icons only carry the white dot.
const CheckedDot = () => (
  <SvgIcon viewBox="0 0 8 8">
    <circle cx={4} cy={4} r={4} fill={neutral.white} />
  </SvgIcon>
)

const NoDot = () => <SvgIcon viewBox="0 0 0 0" />

// Figma Inputs/radioButton (spec 2.11): the checkbox container tokens on a circle. Focus swaps the
// border colour, disabled fades the whole control to 30%.
export const muiRadio = (
  _darkMode?: boolean,
): Components<Omit<Theme, "components">>["MuiRadio"] => ({
  defaultProps: {
    disableRipple: true,
    icon: <NoDot />,
    checkedIcon: <CheckedDot />,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      boxSizing: "border-box",
      width: theme.spacing(2),
      height: theme.spacing(2),
      borderRadius: "50%",
      padding: 0,
      border: `1px solid ${neutralAlpha.darken[200]}`,
      boxShadow: outer.sm,
      backgroundColor: neutral.white,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: neutral.white,
      transition: defaultTransition(theme),
      ...theme.applyStyles("dark", {
        borderColor: neutralAlpha.lighten[200],
        backgroundColor: stone[600],
      }),

      "& input": {
        width: "100%",
        height: "100%",
      },
      "& .MuiSvgIcon-root": {
        display: "none",
      },

      "&:hover": {
        backgroundColor: stone[50],
        ...theme.applyStyles("dark", { backgroundColor: stone[650] }),
      },
      "&:active": {
        backgroundColor: stone[100],
        boxShadow: inner.sm,
        ...theme.applyStyles("dark", { backgroundColor: stone[700] }),
      },

      "&.Mui-checked": {
        backgroundColor: blue[500],
        color: neutral.white,
        ...theme.applyStyles("dark", { backgroundColor: blue[600] }),

        "& .MuiSvgIcon-root": {
          display: "block",
          width: theme.spacing(0.75),
          height: theme.spacing(0.75),
          borderRadius: "50%",
          boxShadow: outer.sm,
        },
        "&:hover": {
          backgroundColor: blue[550],
          ...theme.applyStyles("dark", { backgroundColor: blue[650] }),
        },
        "&:active": {
          backgroundColor: blue[600],
          ...theme.applyStyles("dark", { backgroundColor: blue[700] }),
        },
      },

      "&.Mui-focusVisible": {
        borderColor: focusColor(theme),
      },
      "&.Mui-disabled": {
        opacity: theme.palette.opacity.disabled,
      },
    }),
  },
})
