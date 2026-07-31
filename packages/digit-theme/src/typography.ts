import { ThemeOptions } from "@mui/material/styles"

import { neutral } from "./colors"

import { ThemeProps } from "./types"

import { mobileScaleFactor } from "./mobileScaleFactor"

const linkStyles = (darkMode: boolean) => ({
  textDecoration: "underline" as const,
  textDecorationSkipInk: "auto" as const,
  textDecorationStyle: "solid" as const,
  textDecorationColor: darkMode ? neutral.white : neutral[200],
  textDecorationThickness: "auto" as const,
  textUnderlinePosition: "from-font" as const,
})

// Helper function to create responsive typography
const createTypography = ({
  desktopSize,
  desktopLineHeight,
  mobileSize,
  mobileLineHeight,
  fontWeight = 400,
}: {
  desktopSize: number
  desktopLineHeight: number
  mobileSize?: number
  mobileLineHeight?: number
  fontWeight?: number
}) => ({
  fontSize: `${desktopSize}rem`,
  lineHeight: `${desktopLineHeight}rem`,
  fontWeight,
  letterSpacing: 0,
  ...(mobileSize && mobileLineHeight
    ? {
        "@media (maxWidth: 899px) and not print": {
          fontSize: `${mobileSize}rem`,
          lineHeight: `${mobileLineHeight}rem`,
        },
      }
    : {}),
})

export const typography = ({
  darkMode,
}: ThemeProps): ThemeOptions["typography"] => {
  return {
    fontFamily:
      "Inter var, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji",
    h1: createTypography({
      desktopSize: 2, // 32px
      desktopLineHeight: 2.25, // 36px
      mobileSize: 2 * mobileScaleFactor,
      mobileLineHeight: 2.25 * mobileScaleFactor,
      fontWeight: 600,
    }),
    h2: createTypography({
      desktopSize: 1.75, // 28px
      desktopLineHeight: 2, // 32px
      mobileSize: 1.75 * mobileScaleFactor,
      mobileLineHeight: 2 * mobileScaleFactor,
      fontWeight: 600,
    }),
    h3: createTypography({
      desktopSize: 1.5, // 24px
      desktopLineHeight: 1.75, // 28px
      mobileSize: 1.5 * mobileScaleFactor,
      mobileLineHeight: 1.75 * mobileScaleFactor,
      fontWeight: 600,
    }),
    h4: createTypography({
      desktopSize: 1.25, // 20px
      desktopLineHeight: 1.5, // 24px
      mobileSize: 1.25 * mobileScaleFactor,
      mobileLineHeight: 1.5 * mobileScaleFactor,
      fontWeight: 600,
    }),
    h5: createTypography({
      desktopSize: 1, // 16px
      desktopLineHeight: 1.25, // 20px
      mobileSize: 1 * mobileScaleFactor,
      mobileLineHeight: 1.25 * mobileScaleFactor,
      fontWeight: 600,
    }),
    h6: createTypography({
      desktopSize: 0.8125, // 13px
      desktopLineHeight: 1.25, // 20px
      mobileSize: 0.8125 * mobileScaleFactor,
      mobileLineHeight: 1.25 * mobileScaleFactor,
      fontWeight: 600,
    }),
    subtitle1: createTypography({
      desktopSize: 0.8125, // 13px
      desktopLineHeight: 1, // 16px
      mobileSize: 0.8125 * mobileScaleFactor,
      mobileLineHeight: 1 * mobileScaleFactor,
      fontWeight: 400,
    }),
    subtitle2: createTypography({
      desktopSize: 0.8125, // 13px
      desktopLineHeight: 1, // 16px
      mobileSize: 0.8125 * mobileScaleFactor,
      mobileLineHeight: 1 * mobileScaleFactor,
      fontWeight: 500,
    }),
    body1: createTypography({
      desktopSize: 0.8125, // 13px
      desktopLineHeight: 1.25, // 20px
      mobileSize: 1, // 16px on mobile
      mobileLineHeight: 1.25 * mobileScaleFactor,
      fontWeight: 400,
    }),
    body1Link: {
      ...createTypography({
        desktopSize: 0.8125, // 13px
        desktopLineHeight: 1.25, // 20px
        mobileSize: 1, // 16px on mobile
        mobileLineHeight: 1.25 * mobileScaleFactor,
        fontWeight: 600,
      }),
      ":hover": linkStyles(darkMode),
    },
    body2: createTypography({
      desktopSize: 0.8125, // 13px
      desktopLineHeight: 1.25, // 20px
      mobileSize: 0.8125 * mobileScaleFactor, // 16px on mobile
      mobileLineHeight: 1.25 * mobileScaleFactor,
      fontWeight: 600,
    }),
    body2Link: {
      ...createTypography({
        desktopSize: 0.8125, // 13px
        desktopLineHeight: 1.25, // 20px
        mobileSize: 0.8125 * mobileScaleFactor, // 16px on mobile
        mobileLineHeight: 1.25 * mobileScaleFactor,
        fontWeight: 700,
      }),
      ":hover": linkStyles(darkMode),
    },
    button: {
      ...createTypography({
        desktopSize: 0.8125, // 13px
        desktopLineHeight: 1, // 16px
        mobileSize: 0.8125 * mobileScaleFactor,
        mobileLineHeight: 1 * mobileScaleFactor,
        fontWeight: 500,
      }),
      textTransform: "none", // Regular capitalization
    },
    buttonSm: {
      ...createTypography({
        desktopSize: 0.8125, // 13px
        desktopLineHeight: 0.75, // 12px
        mobileSize: 0.6875 * mobileScaleFactor,
        mobileLineHeight: 0.75 * mobileScaleFactor,
        fontWeight: 500,
      }),
      textTransform: "none", // Regular capitalization
    },
    caption: createTypography({
      desktopSize: 0.75, // 12px
      desktopLineHeight: 1, // 16px
      mobileSize: 0.75 * mobileScaleFactor,
      mobileLineHeight: 1 * mobileScaleFactor,
      fontWeight: 400,
    }),
    caption2: createTypography({
      desktopSize: 0.75, // 12px
      desktopLineHeight: 1, // 16px
      mobileSize: 0.75 * mobileScaleFactor,
      mobileLineHeight: 1 * mobileScaleFactor,
      fontWeight: 500,
    }),
    overline: {
      ...createTypography({
        desktopSize: 0.6875, // 11px
        desktopLineHeight: 1, // 16px
        mobileSize: 0.6875 * mobileScaleFactor,
        mobileLineHeight: 1 * mobileScaleFactor,
        fontWeight: 400,
      }),
      textTransform: "none",
    },
    overlineLink: {
      ...createTypography({
        desktopSize: 0.6875, // 11px
        desktopLineHeight: 1, // 16px
        mobileSize: 0.6875 * mobileScaleFactor,
        mobileLineHeight: 1 * mobileScaleFactor,
        fontWeight: 600,
      }),
      textTransform: "none",
      ...linkStyles(darkMode),
    },
    overline2: {
      ...createTypography({
        desktopSize: 0.6875, // 11px
        desktopLineHeight: 1, // 16px
        mobileSize: 0.6875 * mobileScaleFactor,
        mobileLineHeight: 1 * mobileScaleFactor,
        fontWeight: 500,
      }),
    },
  }
}
