import { CSSObject } from "@mui/material/styles"
import { type CSSProperties, type PaletteColor, type PaletteColorOptions } from "@mui/material/styles"

import { type AccentColorName } from "./accent-colors"

export interface ThemeProps {
  darkMode: boolean
}

declare module "@mui/material/Button" {
  interface ButtonPropsSizeOverrides {
    xs: true
  }
  interface ButtonClasses {
    sizeXs: string
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides extends Record<AccentColorName, true> {}
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    caption2: true
    overline2: true
    body1Link: true
    body2Link: true
    buttonSm: true
    overlineLink: true
    pillSm: true
    pillMd: true
    mono: true
  }
}

declare module "@mui/material/styles" {
  interface TypographyVariants {
    caption2: CSSProperties
    overline2: CSSProperties
    body1Link: CSSObject
    body2Link: CSSObject
    button: CSSProperties
    buttonSm: CSSProperties
    overlineLink: CSSProperties
    pillSm: CSSProperties
    pillMd: CSSProperties
    mono: CSSProperties
  }

  interface TypographyVariantsOptions {
    caption2?: CSSProperties
    overline2?: CSSProperties
    body1Link?: CSSObject
    body2Link?: CSSObject
    button?: CSSProperties
    buttonSm?: CSSProperties
    overlineLink?: CSSProperties
    pillSm?: CSSProperties
    pillMd?: CSSProperties
    mono?: CSSProperties
  }

  interface TypeText {
    tertiary?: string
  }

  interface TypeBackground {
    surface?: string
    secondary?: string
  }

  interface Palette extends Record<AccentColorName, PaletteColor> {
    border: {
      default: string
      strong: string
      extrastrong: string
    }
    divider: string
    opacity: {
      helper: number
      disabled: number
    }
    tabFocus: string
  }
  interface PaletteOptions extends Partial<Record<AccentColorName, PaletteColorOptions>> {
    border?: {
      default?: string
      strong?: string
      extrastrong?: string
    }
    divider?: string
    opacity?: {
      helper?: number
      disabled?: number
    }
    tabFocus?: string
  }

  interface Theme {
    spacingMultiplier: {
      xs: number
      md: number
    }
  }

  interface ThemeOptions {
    spacingMultiplier?: {
      xs?: number
      md?: number
    }
  }
}
