import { CSSObject } from "@mui/material/styles"
import { type CSSProperties } from "@mui/material/styles"

export interface ThemeProps {
  darkMode: boolean
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    caption2: true
    overline2: true
    body1Link: true
    body2Link: true
    buttonSm: true
    overlineLink: true
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
  }

  interface TypographyVariantsOptions {
    caption2?: CSSProperties
    overline2?: CSSProperties
    body1Link?: CSSObject
    body2Link?: CSSObject
    button?: CSSProperties
    buttonSm?: CSSProperties
    overlineLink?: CSSProperties
  }

  interface TypeText {
    tertiary?: string
  }

  interface TypeBackground {
    surface?: string
  }

  interface Palette {
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
  interface PaletteOptions {
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
