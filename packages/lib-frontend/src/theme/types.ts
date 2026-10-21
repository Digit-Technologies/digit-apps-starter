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
  /** Destructive contained-secondary (white button, red hover/press). See theme/muiButton.ts. */
  interface ButtonPropsColorOverrides {
    errorSecondary: true
  }
  interface ButtonClasses {
    sizeXs: string
  }
}

declare module "@mui/material/IconButton" {
  interface IconButtonPropsSizeOverrides {
    xs: true
  }
  /** Destructive contained-secondary icon button. See theme/muiIconButton.ts. */
  interface IconButtonPropsColorOverrides {
    errorSecondary: true
  }
  interface IconButtonClasses {
    sizeXs: string
  }
}

declare module "@mui/material/Badge" {
  interface BadgePropsVariantOverrides {
    count: true
  }
}

// Figma field sizes: xs 20px, sm 28px (small and medium), md 36px (large). See muiFilledInput.ts.
declare module "@mui/material/InputBase" {
  interface InputBasePropsSizeOverrides {
    xs: true
    large: true
  }
}
declare module "@mui/material/TextField" {
  interface TextFieldPropsSizeOverrides {
    xs: true
    large: true
  }
}
declare module "@mui/material/FormControl" {
  interface FormControlPropsSizeOverrides {
    xs: true
    large: true
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
      /** Solid #e5e5e5 line: page header, toolbar and menu outlines. */
      solidStrong: string
      /** Solid #f5f5f5 line: section dividers inside a page or card. */
      solidDefault: string
    }
    table: {
      hover: string
      selected: string
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
      solidStrong?: string
      solidDefault?: string
    }
    table?: {
      hover?: string
      selected?: string
    }
    divider?: string
    opacity?: {
      helper?: number
      disabled?: number
    }
    tabFocus?: string
  }

}
