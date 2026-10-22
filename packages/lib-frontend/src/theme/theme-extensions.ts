import { type PaletteOptions } from "@mui/material/styles"

import { neutral, neutralAlpha, stone } from "./colors"

/** The palette keys Digit adds on top of MUI's, per mode. See the augmentation in types.ts. */
export const getThemeExtensions = (
  darkMode: boolean,
): Required<Pick<PaletteOptions, "border" | "table" | "divider" | "opacity">> => ({
  border: {
    // Figma paper/border/alpha/default, /strong and /extraStrong.
    default: darkMode ? neutralAlpha.lighten[50] : neutralAlpha.darken[50],
    strong: darkMode ? neutralAlpha.lighten[100] : neutralAlpha.darken[100],
    extrastrong: darkMode ? neutralAlpha.lighten[200] : neutralAlpha.darken[200],
    // Figma paper/border/solid/strong and /default. Solid lines for page chrome (page header,
    // toolbar, menu outlines, sidebar edge) and for section dividers inside a page or card.
    solidStrong: darkMode ? neutral[600] : neutral[200],
    solidDefault: darkMode ? neutral[700] : neutral[100],
  },
  // Figma table/row/background/*.
  table: {
    hover: darkMode ? stone[750] : stone[50],
    selected: darkMode ? stone[700] : stone[100],
  },
  divider: darkMode ? neutralAlpha.lighten[50] : neutralAlpha.darken[50],
  // Figma all/opacity/helper and all/opacity/disabled.
  opacity: {
    helper: 0.6,
    disabled: 0.3,
  },
})
