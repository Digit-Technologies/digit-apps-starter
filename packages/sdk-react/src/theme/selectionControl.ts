import { Theme } from "@mui/material/styles"

import { blue, neutral, neutralAlpha, stone } from "./colors.js"
import { isDarkMode } from "./helpers/isDarkMode.js"

/**
 * Figma form/input/checkbox-radio/container and form/input/switch/container fills, per mode.
 * Checkbox and Radio share every value; Switch shares the "on" fills and has its own "off" track.
 */
export const selectionControlColors = (theme: Theme) => {
  const dark = isDarkMode(theme)
  return {
    border: dark ? neutralAlpha.lighten[200] : neutralAlpha.darken[200],
    off: dark ? stone[600] : neutral.white,
    offHover: dark ? stone[650] : stone[50],
    offPressed: dark ? stone[700] : stone[100],
    on: dark ? blue[600] : blue[500],
    onHover: dark ? blue[650] : blue[550],
    onPressed: dark ? blue[700] : blue[600],
    switchBorder: dark ? neutralAlpha.lighten[100] : neutralAlpha.darken[100],
    switchOff: dark ? stone[600] : stone[100],
    switchOffHover: dark ? stone[650] : stone[150],
    switchOffPressed: dark ? stone[700] : stone[200],
  }
}
