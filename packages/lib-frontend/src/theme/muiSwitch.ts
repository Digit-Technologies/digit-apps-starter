import { Components, Theme } from "@mui/material/styles"

import { blue, neutral, neutralAlpha, stone } from "./colors"
import { focusColor } from "./focus"
import { inner, outer } from "./shadows"

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
    root: ({ theme }) => ({
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
        border: `1px solid ${neutralAlpha.darken[100]}`,
      },

      "& .MuiSwitch-track": {
        boxSizing: "border-box",
        borderRadius: theme.spacing(2.5),
        border: `1px solid ${neutralAlpha.darken[100]}`,
        backgroundColor: stone[100],
        opacity: 1,
        ...theme.applyStyles("dark", {
          borderColor: neutralAlpha.lighten[100],
          backgroundColor: stone[600],
        }),
      },
      [`${enabled}:hover .MuiSwitch-track`]: {
        backgroundColor: stone[150],
        ...theme.applyStyles("dark", { backgroundColor: stone[650] }),
      },
      [`${enabled}:active .MuiSwitch-track`]: {
        backgroundColor: stone[200],
        boxShadow: inner.sm,
        ...theme.applyStyles("dark", { backgroundColor: stone[700] }),
      },

      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
        backgroundColor: blue[500],
        ...theme.applyStyles("dark", { backgroundColor: blue[600] }),
      },
      [`${enabled}:hover .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track`]: {
        backgroundColor: blue[550],
        ...theme.applyStyles("dark", { backgroundColor: blue[650] }),
      },
      [`${enabled}:active .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track`]: {
        backgroundColor: blue[600],
        ...theme.applyStyles("dark", { backgroundColor: blue[700] }),
      },

      "& .MuiSwitch-switchBase.Mui-focusVisible + .MuiSwitch-track": {
        borderColor: focusColor(theme),
      },
    }),
  },
})
