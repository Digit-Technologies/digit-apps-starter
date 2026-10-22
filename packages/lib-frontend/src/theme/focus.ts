import { Theme } from "@mui/material/styles"

import { blue } from "./colors"

/**
 * Figma button-iconButton/all/outline/focus (also tab/outline/focus and every form
 * …/border/tab-focused token): #155dfc in light mode, #51a2ff in dark mode.
 */
export const focusColor = (theme: Theme): string =>
  theme.palette.mode === "dark" ? blue[400] : blue[600]

/**
 * Figma Focus/focus: a 2px gap in page/background/secondary, then a 2px ring (spread 2 over
 * spread 4). Use it as the `boxShadow` of a focused button, icon button, or anything else that
 * draws a ring around itself. Form fields, checkboxes, radios and switches swap their border
 * colour to `focusColor` instead.
 */
export const focusRing = (theme: Theme): string =>
  `0 0 0 2px ${theme.palette.background.secondary}, 0 0 0 4px ${focusColor(theme)}`
