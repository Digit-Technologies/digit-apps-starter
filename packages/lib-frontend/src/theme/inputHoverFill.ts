import { Theme } from "@mui/material/styles"

import { neutralAlpha } from "./colors"

/**
 * Faint fill shown on hover so typeable fields read as editable
 * (design: form/input/field/default/background = rgba(0,0,0,0.05)).
 * Shared by the OutlinedInput and PickersInputBase theme overrides.
 */
export const inputHoverFillColor = (theme: Theme): string =>
  theme.palette.mode === "dark"
    ? neutralAlpha.lighten[50]
    : neutralAlpha.darken[50]
