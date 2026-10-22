import { Theme } from "@mui/material/styles"

import { blue, neutralAlpha } from "./colors"
import { isDarkMode } from "./helpers/isDarkMode"

/**
 * Figma form/input/field fills (spec 2.14), per mode. `field*` is the "Outlined" (grey) field that
 * FilledInput and OutlinedInput draw; `invisible*` is the borderless field that Input
 * (variant="standard") draws, transparent until hover.
 */
export const fieldColors = (theme: Theme) => {
  const dark = isDarkMode(theme)
  return {
    fill: dark ? neutralAlpha.lighten[150] : neutralAlpha.darken[50],
    hoverFill: dark ? neutralAlpha.lighten[100] : neutralAlpha.darken[100],
    disabledFill: dark ? neutralAlpha.lighten[50] : neutralAlpha.darken[50],
    invisibleHoverFill: dark ? neutralAlpha.lighten[100] : neutralAlpha.darken[50],
    placeholder: dark ? neutralAlpha.lighten[400] : neutralAlpha.darken[400],
    // Figma text selection highlight (pill/background/blue).
    selection: dark ? blue[750] : blue[250],
  }
}
