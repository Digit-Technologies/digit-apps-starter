import React from "react"

import SvgIcon, { SvgIconProps } from "@mui/material/SvgIcon"
import { Components, Theme } from "@mui/material/styles"

import { neutral } from "./colors"
import { focusColor } from "./focus"
import { selectionControlColors } from "./selectionControl"
import { inner, outer } from "./shadows"

// Figma Inputs/Checkbox/Set: a 16px box with a 12px glyph. The svg itself is the box (border, fill
// and shadow come from the styleOverrides below), so every state is plain CSS and works in both
// modes. The 1px border sits inside the svg's box, so the viewBox starts at 1 to keep the glyph
// coordinates on the 16px grid.
const CheckboxBox = ({ children, ...props }: SvgIconProps) => (
  <SvgIcon viewBox="1 1 14 14" {...props}>
    {children}
  </SvgIcon>
)

const glyph = {
  fill: "none",
  stroke: neutral.white,
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

const UncheckedIcon = (props: SvgIconProps) => <CheckboxBox {...props} />
const CheckedIcon = (props: SvgIconProps) => (
  <CheckboxBox {...props}>
    <path d="M12 5 6.5 10.5 4 8" {...glyph} />
  </CheckboxBox>
)
const IndeterminateIcon = (props: SvgIconProps) => (
  <CheckboxBox {...props}>
    <path d="M4.5 8h7" {...glyph} />
  </CheckboxBox>
)

// Figma form/input/checkbox-radio tokens (spec 2.10). Off and on fills per state, the a.20 / w.20
// border stays on when checked, focus swaps the border colour, and disabled fades the whole control.
export const muiCheckbox = (): Components<Omit<Theme, "components">>["MuiCheckbox"] => ({
  defaultProps: {
    disableRipple: true,
    icon: <UncheckedIcon />,
    checkedIcon: <CheckedIcon />,
    indeterminateIcon: <IndeterminateIcon />,
  },
  styleOverrides: {
    root: ({ theme }) => {
      const c = selectionControlColors(theme)
      return {
        padding: 0,
        borderRadius: theme.spacing(0.5),
        // No MUI hover halo: the box itself changes fill.
        "&:hover": { backgroundColor: "transparent" },
        "& .MuiSvgIcon-root": {
          display: "block",
          boxSizing: "border-box",
          width: theme.spacing(2),
          height: theme.spacing(2),
          borderRadius: theme.spacing(0.5),
          border: `1px solid ${c.border}`,
          backgroundColor: c.off,
          boxShadow: outer.sm,
        },
        "&:hover .MuiSvgIcon-root": { backgroundColor: c.offHover },
        "&:active .MuiSvgIcon-root": { backgroundColor: c.offPressed, boxShadow: inner.sm },
        "&.Mui-checked .MuiSvgIcon-root, &.MuiCheckbox-indeterminate .MuiSvgIcon-root": {
          backgroundColor: c.on,
        },
        "&.Mui-checked:hover .MuiSvgIcon-root, &.MuiCheckbox-indeterminate:hover .MuiSvgIcon-root": {
          backgroundColor: c.onHover,
        },
        "&.Mui-checked:active .MuiSvgIcon-root, &.MuiCheckbox-indeterminate:active .MuiSvgIcon-root": {
          backgroundColor: c.onPressed,
        },
        "&.Mui-focusVisible .MuiSvgIcon-root": {
          borderColor: focusColor(theme),
        },
        "&.Mui-disabled": {
          opacity: theme.palette.opacity.disabled,
        },
      }
    },
  },
})
