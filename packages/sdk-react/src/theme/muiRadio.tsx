import React from "react"

import SvgIcon from "@mui/material/SvgIcon"
import { Components, Theme } from "@mui/material/styles"

import { neutral } from "./colors.js"
import { focusColor } from "./focus.js"
import { selectionControlColors } from "./selectionControl.js"
import { inner, outer } from "./shadows.js"
import { defaultTransition } from "./transitions.js"

// The root span is the 16px circle, so the icons only carry the white dot.
const CheckedDot = () => (
  <SvgIcon viewBox="0 0 8 8">
    <circle cx={4} cy={4} r={4} fill={neutral.white} />
  </SvgIcon>
)

const NoDot = () => <SvgIcon viewBox="0 0 0 0" />

// Figma Inputs/radioButton (spec 2.11): the checkbox container tokens on a circle. Focus swaps the
// border colour, disabled fades the whole control to 30%.
export const muiRadio = (): Components<Omit<Theme, "components">>["MuiRadio"] => ({
  defaultProps: {
    disableRipple: true,
    icon: <NoDot />,
    checkedIcon: <CheckedDot />,
  },
  styleOverrides: {
    root: ({ theme }) => {
      const c = selectionControlColors(theme)
      return {
        boxSizing: "border-box",
        width: theme.spacing(2),
        height: theme.spacing(2),
        borderRadius: "50%",
        padding: 0,
        border: `1px solid ${c.border}`,
        boxShadow: outer.sm,
        backgroundColor: c.off,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: neutral.white,
        transition: defaultTransition(theme),

        "& input": {
          width: "100%",
          height: "100%",
        },
        "& .MuiSvgIcon-root": {
          display: "none",
        },

        "&:hover": { backgroundColor: c.offHover },
        "&:active": { backgroundColor: c.offPressed, boxShadow: inner.sm },

        "&.Mui-checked": {
          backgroundColor: c.on,
          "& .MuiSvgIcon-root": {
            display: "block",
            width: theme.spacing(0.75),
            height: theme.spacing(0.75),
            borderRadius: "50%",
            boxShadow: outer.sm,
          },
          "&:hover": { backgroundColor: c.onHover },
          "&:active": { backgroundColor: c.onPressed },
        },

        "&.Mui-focusVisible": {
          borderColor: focusColor(theme),
        },
        "&.Mui-disabled": {
          opacity: theme.palette.opacity.disabled,
        },
      }
    },
  },
})
