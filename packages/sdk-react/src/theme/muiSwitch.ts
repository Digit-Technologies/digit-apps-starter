import { Components, Theme } from "@mui/material/styles"

import { neutral, neutralAlpha } from "./colors.js"
import { focusColor } from "./focus.js"
import { selectionControlColors } from "./selectionControl.js"
import { inner, outer } from "./shadows.js"

// The root is a span, so it still gets :hover and :active when the input inside is disabled.
const enabled = "&:not(:has(.Mui-disabled))"

// Figma form/input/switch (spec 2.12): a 32x16 track with a 1px border that stays on when checked,
// and a 10px white thumb inset 3px. Hover and pressed change the track only (pressed adds
// inner/sm), focus swaps the track border colour, and disabled fades the whole control to 30%.
export const muiSwitch = (): Components<Omit<Theme, "components">>["MuiSwitch"] => ({
  defaultProps: {
    disableRipple: true,
  },
  styleOverrides: {
    root: ({ theme }) => {
      const c = selectionControlColors(theme)
      return {
        width: theme.spacing(4),
        height: theme.spacing(2),
        padding: 0,
        overflow: "visible",

        "&:has(.Mui-disabled)": {
          opacity: theme.palette.opacity.disabled,
        },

        "& .MuiSwitch-switchBase": {
          padding: theme.spacing(0.375),
          margin: 0,
          "&:hover": { backgroundColor: "transparent" },
          "&.Mui-checked": {
            transform: `translateX(${theme.spacing(2)})`,
            color: neutral.white,
          },
          // MUI dims the track and recolours the thumb when disabled. The root opacity covers it.
          "&.Mui-disabled": { color: neutral.white },
          "&.Mui-disabled + .MuiSwitch-track, &.Mui-checked + .MuiSwitch-track": { opacity: 1 },
        },

        "& .MuiSwitch-thumb": {
          boxSizing: "border-box",
          width: theme.spacing(1.25),
          height: theme.spacing(1.25),
          boxShadow: outer.sm,
          backgroundColor: neutral.white,
          border: `1px solid ${c.switchBorder}`,
        },

        "& .MuiSwitch-track": {
          boxSizing: "border-box",
          borderRadius: theme.spacing(2.5),
          border: `1px solid ${c.switchBorder}`,
          backgroundColor: c.switchOff,
          opacity: 1,
        },
        [`${enabled}:hover .MuiSwitch-track`]: { backgroundColor: c.switchOffHover },
        [`${enabled}:active .MuiSwitch-track`]: {
          backgroundColor: c.switchOffPressed,
          boxShadow: inner.sm,
        },

        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: c.on },
        [`${enabled}:hover .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track`]: {
          backgroundColor: c.onHover,
        },
        [`${enabled}:active .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track`]: {
          backgroundColor: c.onPressed,
        },

        "& .MuiSwitch-switchBase.Mui-focusVisible + .MuiSwitch-track": {
          borderColor: focusColor(theme),
        },
      }
    },
  },
})
