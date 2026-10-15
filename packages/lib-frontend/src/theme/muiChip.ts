import { Components, Theme } from "@mui/material/styles"

import { blue, green, red, stone, yellow } from "./colors"

// MUI's Chip `color` picks the tone. Filled chips get a light tint of that tone's scale
// (250 in light mode, 750 in dark), with primary text. Outlined chips get a border only.
const toneScales = {
  default: stone,
  success: green,
  warning: yellow,
  error: red,
  info: blue,
} as const

type Tone = keyof typeof toneScales

const isTone = (value: string): value is Tone => value in toneScales

export const muiChip = (): Components<Omit<Theme, "components">>["MuiChip"] => ({
  styleOverrides: {
    root: ({ ownerState, theme }) => {
      const color = ownerState.color ?? "default"
      const scale = toneScales[isTone(color) ? color : "default"]
      const isDark = theme.palette.mode === "dark"

      return {
        borderRadius: theme.spacing(0.75), // 6px
        fontSize: "12px",
        fontWeight: 500,
        height: "20px",
        lineHeight: "20px",
        color: theme.palette.text.primary,
        border: "1px solid transparent",
        ...(ownerState.variant === "outlined"
          ? {
              backgroundColor: "transparent",
              borderColor: theme.palette.border.extrastrong,
            }
          : {
              backgroundColor: isDark ? scale[750] : scale[250],
            }),
        "& .MuiChip-label": {
          paddingLeft: theme.spacing(0.5),
          paddingRight: theme.spacing(0.5),
        },
        "& .MuiChip-icon": {
          color: "inherit",
          marginLeft: theme.spacing(0.5),
          marginRight: -theme.spacing(0.25),
        },
      }
    },
  },
})
