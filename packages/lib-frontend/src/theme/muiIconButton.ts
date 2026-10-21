import { CSSObject, Components, Theme } from "@mui/material/styles"

import { ButtonLook, buttonLookRestStyles, buttonLookStyles } from "./muiButton"
import { defaultTransition } from "./transitions"

/**
 * Figma IconButton (Atoms 10380:21565) has the four Button looks. MUI's IconButton only has
 * `color`, so colour picks the look:
 * - default / inherit / other colours: text look (transparent, neutral icon).
 * - error: text look, destructive (icon stays neutral, red wash on hover and press).
 * - primary: contained-primary (charcoal square).
 * - secondary: contained-secondary (white square with a border and shadow).
 * - errorSecondary: contained-secondary, destructive.
 */
const lookFor = (color: string | undefined): ButtonLook => {
  if (color === "primary") return "containedPrimary"
  if (color === "secondary" || color === "errorSecondary") return "containedSecondary"
  return "text"
}

const isDestructive = (color: string | undefined): boolean =>
  color === "error" || color === "errorSecondary"

// Figma sizes: xs 20 (radius 6, icon 16), sm 28 (8, 16), md 36 (10, 20). MUI small = sm,
// medium = md; large has no Figma size and keeps md.
const sizeTokens: Record<string, { box: number; radius: number; icon: number }> = {
  xs: { box: 20, radius: 6, icon: 16 },
  small: { box: 28, radius: 8, icon: 16 },
  medium: { box: 36, radius: 10, icon: 20 },
  large: { box: 36, radius: 10, icon: 20 },
}

const MOBILE = "@media (max-width: 599px)"
const mobileScale = 1.25

const sizeStyles = (size: string | undefined, scale: number): CSSObject => {
  const s = sizeTokens[size ?? "small"] ?? sizeTokens.small
  const box = `${s.box * scale}px`
  const icon = `${s.icon * scale}px`
  return {
    borderRadius: `${s.radius * scale}px`,
    height: box,
    minWidth: box,
    width: box,
    // Icons are sized here so a caller's `size` on a lucide icon can't drift from Figma. The
    // loading spinner keeps its own size.
    "& .MuiSvgIcon-root, & svg:not(.MuiCircularProgress-svg)": {
      color: "inherit",
      fontSize: icon,
      height: icon,
      stroke: "currentColor",
      width: icon,
    },
  }
}

export const muiIconButton = (_: {
  darkMode: boolean
}): Components<Omit<Theme, "components">>["MuiIconButton"] => {
  return {
    defaultProps: {
      disableRipple: true,
      disableTouchRipple: true,
      disableFocusRipple: true,
      size: "small",
    },
    styleOverrides: {
      root: ({ theme, ownerState }) => {
        const look = lookFor(ownerState.color)
        return {
          padding: 0,
          lineHeight: "1rem", // 16px
          transition: defaultTransition(theme),
          whiteSpace: "nowrap",
          ...sizeStyles(ownerState.size, 1),
          [MOBILE]: sizeStyles(ownerState.size, mobileScale),
          ...buttonLookStyles(theme, look, isDestructive(ownerState.color)),
          // Disabled dims once, through the disabled foreground token (no extra opacity).
          "&.Mui-disabled .MuiSvgIcon-root, &.Mui-disabled svg:not(.MuiCircularProgress-svg)": {
            color: "inherit",
            opacity: 1,
          },
          // MUI disables a loading icon button; keep its resting look and colour the spinner.
          "&.MuiIconButton-loading.Mui-disabled": {
            ...buttonLookRestStyles(theme, look),
            color: "transparent",
            "& .MuiIconButton-loadingIndicator": {
              color: buttonLookRestStyles(theme, look).color,
            },
          },
        }
      },
    },
  }
}
