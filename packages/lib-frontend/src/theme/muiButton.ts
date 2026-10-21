import { CSSObject, Components, Theme } from "@mui/material/styles"

import { neutral, neutralAlpha, red, stone, transparent } from "./colors"
import { focusRing } from "./focus"
import { isDarkMode } from "./helpers/isDarkMode"
import { inner, outer } from "./shadows"

/**
 * The four Figma button looks (Atoms › Button 10380:20077, IconButton 10380:21565). Button and
 * IconButton share them, so both components stay in step.
 */
export type ButtonLook = "containedPrimary" | "containedSecondary" | "outlined" | "text"

interface LookTokens {
  fg: string
  fgDisabled: string
  bg: string
  bgHover: string
  bgPressed: string
  bgSelected?: string
  bgDisabled: string
  border: string
  borderDisabled: string
  /** Contained looks sit on outer/sm and press in with inner/sm. */
  raised: boolean
  /** Destructive=True only changes these two backgrounds; the label never turns red. */
  destructiveHover: string
  destructivePressed: string
}

// Token values from the Figma `button-iconButton/` collection, light and dark.
const lookTokens = (look: ButtonLook, dark: boolean): LookTokens => {
  switch (look) {
    case "containedPrimary":
      return dark
        ? {
            fg: stone[950],
            fgDisabled: stone[750],
            bg: stone[100],
            bgHover: stone[200],
            bgPressed: stone[300],
            bgDisabled: stone[400],
            border: neutralAlpha.lighten[100],
            borderDisabled: neutralAlpha.lighten[50],
            raised: true,
            destructiveHover: red[200],
            destructivePressed: red[250],
          }
        : {
            fg: neutral.white,
            fgDisabled: stone[200],
            bg: stone[700],
            bgHover: stone[800],
            bgPressed: stone[900],
            bgDisabled: stone[400],
            border: neutralAlpha.darken[100],
            borderDisabled: neutralAlpha.darken[50],
            raised: true,
            destructiveHover: red[800],
            destructivePressed: red[850],
          }
    case "containedSecondary":
      return dark
        ? {
            fg: neutral.white,
            fgDisabled: stone[550],
            bg: stone[600],
            bgHover: stone[650],
            bgPressed: stone[700],
            bgDisabled: stone[600],
            border: neutralAlpha.lighten[100],
            borderDisabled: neutralAlpha.lighten[50],
            raised: true,
            destructiveHover: red[800],
            destructivePressed: red[850],
          }
        : {
            fg: stone[950],
            fgDisabled: stone[350],
            bg: neutral.white,
            bgHover: stone[50],
            bgPressed: stone[100],
            bgDisabled: neutral.white,
            border: neutralAlpha.darken[100],
            borderDisabled: neutralAlpha.darken[50],
            raised: true,
            destructiveHover: red[50],
            destructivePressed: red[100],
          }
    // Figma "outlined" is a filled track with a transparent border.
    case "outlined":
      return dark
        ? {
            fg: neutral.white,
            fgDisabled: stone[550],
            bg: neutralAlpha.lighten[150],
            bgHover: neutralAlpha.lighten[100],
            bgPressed: neutralAlpha.lighten[50],
            bgSelected: neutralAlpha.lighten[100],
            bgDisabled: neutralAlpha.lighten[50],
            border: transparent,
            borderDisabled: transparent,
            raised: false,
            destructiveHover: red[850],
            destructivePressed: red[900],
          }
        : {
            fg: stone[950],
            fgDisabled: stone[350],
            bg: neutralAlpha.darken[50],
            bgHover: neutralAlpha.darken[100],
            bgPressed: neutralAlpha.darken[150],
            bgSelected: neutralAlpha.darken[100],
            bgDisabled: neutralAlpha.darken[50],
            border: transparent,
            borderDisabled: transparent,
            raised: false,
            destructiveHover: red[100],
            destructivePressed: red[150],
          }
    case "text":
      return dark
        ? {
            fg: neutral.white,
            fgDisabled: stone[550],
            bg: transparent,
            bgHover: neutralAlpha.lighten[100],
            bgPressed: neutralAlpha.lighten[50],
            bgSelected: neutralAlpha.lighten[100],
            bgDisabled: transparent,
            border: transparent,
            borderDisabled: transparent,
            raised: false,
            destructiveHover: red[800],
            destructivePressed: red[850],
          }
        : {
            fg: stone[950],
            fgDisabled: stone[350],
            bg: transparent,
            bgHover: neutralAlpha.darken[50],
            bgPressed: neutralAlpha.darken[100],
            bgSelected: neutralAlpha.darken[50],
            bgDisabled: transparent,
            border: transparent,
            borderDisabled: transparent,
            raised: false,
            destructiveHover: red[50],
            destructivePressed: red[100],
          }
  }
}

/** The resting colours of a look, used for its default state and while it loads. */
export const buttonLookRestStyles = (theme: Theme, look: ButtonLook): CSSObject => {
  const t = lookTokens(look, isDarkMode(theme))
  return {
    color: t.fg,
    backgroundColor: t.bg,
    borderColor: t.border,
    boxShadow: t.raised ? outer.sm : "none",
  }
}

/** Every state of a look: default, hover (pointer devices only), pressed, selected, focus, disabled. */
export const buttonLookStyles = (
  theme: Theme,
  look: ButtonLook,
  destructive = false,
): CSSObject => {
  const t = lookTokens(look, isDarkMode(theme))
  return {
    ...buttonLookRestStyles(theme, look),
    border: `1px solid ${t.border}`,
    "@media (hover: hover)": {
      "&:hover": {
        backgroundColor: destructive ? t.destructiveHover : t.bgHover,
        // MUI's disableElevation sets boxShadow none on hover; contained looks keep outer/sm.
        boxShadow: t.raised ? outer.sm : "none",
      },
    },
    "&:active": {
      backgroundColor: destructive ? t.destructivePressed : t.bgPressed,
      // Figma pressed: contained looks swap outer/sm for inner/sm; outlined and text have no shadow.
      boxShadow: t.raised ? inner.sm : "none",
    },
    ...(t.bgSelected && {
      // MUI Button has no selected prop; toggle-style buttons set aria-pressed or Mui-selected.
      '&.Mui-selected, &[aria-pressed="true"]': {
        backgroundColor: t.bgSelected,
      },
    }),
    // Figma Focus/focus on every look: a 2px page-colour gap, then the 2px blue ring.
    "&.Mui-focusVisible": {
      boxShadow: focusRing(theme),
    },
    "&.Mui-disabled": {
      color: t.fgDisabled,
      backgroundColor: t.bgDisabled,
      borderColor: t.borderDisabled,
      boxShadow: t.raised ? outer.sm : "none",
    },
  }
}

const isDestructive = (color: string | undefined): boolean =>
  color === "error" || color === "errorSecondary"

/**
 * contained + primary → contained-primary; contained + error → destructive contained-primary;
 * contained + errorSecondary → destructive contained-secondary; any other contained colour →
 * contained-secondary. outlined and text keep their look for every colour, and error or
 * errorSecondary makes them destructive.
 */
const lookFor = (variant: string | undefined, color: string | undefined): ButtonLook => {
  if (variant === "outlined") return "outlined"
  if (variant === "text") return "text"
  return color === "primary" || color === "error" ? "containedPrimary" : "containedSecondary"
}

interface SizeTokens {
  height: number
  paddingX: number
  gap: number
  radius: number
  icon: number
}

// Figma button/height, padding-x, gap, border-radius and icon size. MUI's "large" has no Figma
// size, so it uses md.
const sizeTokens: Record<string, SizeTokens> = {
  xs: { height: 20, paddingX: 4, gap: 2, radius: 6, icon: 16 },
  small: { height: 28, paddingX: 8, gap: 4, radius: 8, icon: 16 },
  medium: { height: 36, paddingX: 12, gap: 6, radius: 10, icon: 20 },
  large: { height: 36, paddingX: 12, gap: 6, radius: 10, icon: 20 },
}

const MOBILE = "@media (max-width: 599px)"
const mobileScale = 1.25
const px = (n: number, scale = 1): string => `${n * scale}px`

const tokensFor = (size: string | undefined): SizeTokens =>
  sizeTokens[size ?? "small"] ?? sizeTokens.small

const sizeStyles = (s: SizeTokens, scale: number): CSSObject => ({
  minHeight: px(s.height, scale),
  minWidth: px(s.height, scale),
  padding: `0 ${px(s.paddingX, scale)}`,
  gap: px(s.gap, scale),
  borderRadius: px(s.radius, scale),
})

// Icons are sized here so a caller's `size` on a lucide icon can't drift from Figma.
const iconStyles = (s: SizeTokens, scale: number): CSSObject => ({
  "& > *:nth-of-type(1)": { fontSize: px(s.icon, scale) },
  "& svg, & .MuiButton-loadingIconPlaceholder": {
    width: px(s.icon, scale),
    height: px(s.icon, scale),
  },
})

const iconSlot = (size: string | undefined): CSSObject => {
  const s = tokensFor(size)
  return {
    // The root's gap is the Figma icon-label gap; MUI's own margins would add to it.
    marginLeft: 0,
    marginRight: 0,
    ...iconStyles(s, 1),
    [MOBILE]: iconStyles(s, mobileScale),
  }
}

export const muiButton = (): Components<Omit<Theme, "components">>["MuiButton"] => {
  return {
    styleOverrides: {
      root: ({ theme, ownerState }) => {
        const s = tokensFor(ownerState.size)
        return {
          ...theme.typography.button,
          ...sizeStyles(s, 1),
          [MOBILE]: {
            ...sizeStyles(s, mobileScale),
            // Figma button/Sm|Md on mobile: 16.25 / 20 (theme.typography.button at ×1.25).
            fontSize: `${(13 * mobileScale) / 16}rem`,
            lineHeight: `${(16 * mobileScale) / 16}rem`,
          },
          ...buttonLookStyles(
            theme,
            lookFor(ownerState.variant, ownerState.color),
            isDestructive(ownerState.color),
          ),
          "&.Mui-disabled .MuiButton-startIcon, &.Mui-disabled .MuiButton-endIcon": {
            color: "inherit",
          },
          "&.Mui-disabled .MuiButton-startIcon > *, &.Mui-disabled .MuiButton-endIcon > *": {
            color: "inherit",
            stroke: "currentColor",
          },
        }
      },
      startIcon: ({ ownerState }) => iconSlot(ownerState.size),
      endIcon: ({ ownerState }) => iconSlot(ownerState.size),
      // The indicator box matches the icon. With loadingPosition="start" it sits exactly on the
      // start icon (which MUI hides), at the button's padding. Center and end keep MUI's placement.
      loadingIndicator: ({ ownerState }) => {
        const s = tokensFor(ownerState.size)
        const box = (scale: number): CSSObject => ({
          width: px(s.icon, scale),
          height: px(s.icon, scale),
          ...(ownerState.loadingPosition === "start" &&
            !ownerState.fullWidth && { left: px(s.paddingX, scale) }),
        })
        return {
          alignItems: "center",
          justifyContent: "center",
          color: "currentColor",
          ...box(1),
          [MOBILE]: box(mobileScale),
        }
      },
      // MUI disables a loading button, and the disabled colours would grey it out. A loading
      // button keeps its resting look instead.
      loading: ({ theme, ownerState }) => {
        const rest = buttonLookRestStyles(theme, lookFor(ownerState.variant, ownerState.color))
        // A centred spinner replaces the label: the label goes transparent, and the spinner keeps
        // the colour the label would have had.
        const centred = (ownerState.loadingPosition ?? "center") === "center"
        return {
          "&.MuiButton-loading.Mui-disabled": centred
            ? {
                ...rest,
                color: "transparent",
                "& .MuiButton-loadingIndicator": { color: rest.color },
              }
            : rest,
        }
      },
    },
    defaultProps: {
      color: "secondary",
      size: "small",
      variant: "contained",
      disableRipple: true,
      // Native buttons sit flat. Their depth comes from the outer shadow in the looks above.
      disableElevation: true,
    },
  }
}
