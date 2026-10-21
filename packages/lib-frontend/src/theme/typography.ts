import { ThemeOptions } from "@mui/material/styles"

import { neutralAlpha } from "./colors"

import { ThemeProps } from "./types"

import { mobileScaleFactor } from "./mobileScaleFactor"

// Figma link-hover: a 1px underline at 25% of the text colour. Links have no underline at rest.
const linkHoverStyles = (darkMode: boolean) => ({
  textDecoration: "underline" as const,
  textDecorationSkipInk: "auto" as const,
  textDecorationStyle: "solid" as const,
  textDecorationColor: darkMode ? neutralAlpha.lighten[250] : neutralAlpha.darken[250],
  textDecorationThickness: "1px",
  textUnderlinePosition: "from-font" as const,
})

// Every Figma text style is set in theme-spacing units, so below 600px each size and line height
// grows by the mobile scale factor (8px base on desktop, 10px on mobile).
const createTypography = ({
  size,
  lineHeight,
  fontWeight = 400,
}: {
  /** px on desktop */
  size: number
  /** px on desktop */
  lineHeight: number
  fontWeight?: number
}) => ({
  fontSize: `${size / 16}rem`,
  lineHeight: `${lineHeight / 16}rem`,
  fontWeight,
  letterSpacing: 0,
  "@media (max-width: 599px) and not print": {
    fontSize: `${(size * mobileScaleFactor) / 16}rem`,
    lineHeight: `${(lineHeight * mobileScaleFactor) / 16}rem`,
  },
})

// Values from the Figma Styles page, Typography section (node 10078:11318).
export const typography = ({
  darkMode,
}: ThemeProps): ThemeOptions["typography"] => {
  return {
    fontFamily:
      "InterVariable, Inter var, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji",
    h1: createTypography({ size: 24, lineHeight: 32, fontWeight: 500 }),
    h2: createTypography({ size: 22, lineHeight: 28, fontWeight: 600 }),
    h3: createTypography({ size: 20, lineHeight: 24, fontWeight: 600 }),
    h4: createTypography({ size: 18, lineHeight: 24, fontWeight: 600 }),
    h5: createTypography({ size: 16, lineHeight: 24, fontWeight: 600 }),
    h6: createTypography({ size: 13, lineHeight: 16, fontWeight: 600 }),
    subtitle1: createTypography({ size: 13, lineHeight: 16, fontWeight: 400 }),
    subtitle2: createTypography({ size: 13, lineHeight: 16, fontWeight: 500 }),
    body1: createTypography({ size: 13, lineHeight: 16, fontWeight: 400 }),
    body1Link: {
      ...createTypography({ size: 13, lineHeight: 16, fontWeight: 600 }),
      ":hover": linkHoverStyles(darkMode),
    },
    body2: createTypography({ size: 13, lineHeight: 16, fontWeight: 500 }),
    body2Link: {
      ...createTypography({ size: 13, lineHeight: 16, fontWeight: 600 }),
      ":hover": linkHoverStyles(darkMode),
    },
    // Figma utility/body/mono. Only for code-like strings such as API keys and raw IDs; numbers,
    // money, dates and record IDs use the normal text styles with Inter's tabular figures.
    mono: {
      fontFamily: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: "0.75rem", // 12px
      lineHeight: "0.9375rem", // 15px
      fontWeight: 400,
      letterSpacing: 0,
    },
    button: {
      ...createTypography({ size: 13, lineHeight: 16, fontWeight: 500 }),
      textTransform: "none",
    },
    buttonSm: {
      ...createTypography({ size: 13, lineHeight: 16, fontWeight: 500 }),
      textTransform: "none",
    },
    caption: createTypography({ size: 12, lineHeight: 16, fontWeight: 400 }),
    caption2: createTypography({ size: 12, lineHeight: 16, fontWeight: 500 }),
    overline: {
      ...createTypography({ size: 11, lineHeight: 12, fontWeight: 400 }),
      textTransform: "none",
    },
    overlineLink: {
      ...createTypography({ size: 11, lineHeight: 12, fontWeight: 600 }),
      textTransform: "none",
      ":hover": linkHoverStyles(darkMode),
    },
    overline2: {
      ...createTypography({ size: 11, lineHeight: 12, fontWeight: 500 }),
      textTransform: "none",
    },
    pillSm: createTypography({ size: 11, lineHeight: 12, fontWeight: 500 }),
    pillMd: createTypography({ size: 12, lineHeight: 16, fontWeight: 500 }),
  }
}
