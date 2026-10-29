import { createElement, type SVGProps } from "react"

import { Components, Theme } from "@mui/material/styles"

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "../icons.js"
import { blue, emerald, green, red, yellow } from "./colors.js"
import { outer } from "./shadows.js"

// Figma Alert (10381:25632), Contained form. Light uses the [50] fill and [100] border, dark the
// [950] fill and [700] border (yellow is [900]); icons are [550] in light and [350] in dark
// ([450] for failure). Success switches from green to emerald in dark, as in Figma.
const severityTokens: Record<
  "info" | "success" | "warning" | "error",
  { light: { bg: string; border: string; icon: string }; dark: { bg: string; border: string; icon: string } }
> = {
  info: {
    light: { bg: blue[50], border: blue[100], icon: blue[550] },
    dark: { bg: blue[950], border: blue[700], icon: blue[350] },
  },
  success: {
    light: { bg: green[50], border: green[100], icon: emerald[550] },
    dark: { bg: emerald[950], border: emerald[700], icon: emerald[350] },
  },
  warning: {
    light: { bg: yellow[50], border: yellow[100], icon: yellow[550] },
    dark: { bg: yellow[900], border: yellow[700], icon: yellow[350] },
  },
  error: {
    light: { bg: red[50], border: red[100], icon: red[550] },
    dark: { bg: red[950], border: red[700], icon: red[450] },
  },
}

// Only the standard variant gets the Figma tint. Filled and outlined keep MUI's look, so they stay
// distinct.
const severityStyle =
  (severity: keyof typeof severityTokens) =>
  ({ theme }: { theme: Theme }) => {
    const { light, dark } = severityTokens[severity]
    return {
      backgroundColor: light.bg,
      borderColor: light.border,
      color: theme.palette.text.primary,
      "& .MuiAlert-icon": { color: light.icon },
      ...theme.applyStyles("dark", {
        backgroundColor: dark.bg,
        borderColor: dark.border,
        "& .MuiAlert-icon": { color: dark.icon },
      }),
    }
  }

// Lucide glyphs from the Figma alert: info, triangle-alert, circle-alert and circle-check.
const iconMapping = {
  info: createElement(Info),
  warning: createElement(TriangleAlert),
  error: createElement(CircleAlert),
  success: createElement(CircleCheck),
}

// The close button uses the Lucide x like the rest of the UI. MUI passes `fontSize` and
// `ownerState` to the slot, which must not reach the <svg>.
const CloseIcon = ({
  ownerState: _ownerState,
  fontSize: _fontSize,
  ...props
}: SVGProps<SVGSVGElement> & { ownerState?: unknown; fontSize?: unknown }) => createElement(X, props)

/**
 * Layout follows the Figma contained alert: padding 8, gap 8, radius 12, 1px border, icon 16.
 * A message on its own is body1 (13/16, primary). With an `<AlertTitle>`, the title is body2
 * (13/16 500, primary) and the message under it is the overline subtitle (11/12, secondary).
 * `variant="neutral"` is the untinted Neutral alert; pass `icon` (or `icon={false}`) with it,
 * since MUI picks the default icon from `severity`.
 */
export const muiAlert = (): Components<Omit<Theme, "components">>["MuiAlert"] => ({
  defaultProps: {
    iconMapping,
    slots: { closeIcon: CloseIcon },
  },
  variants: [
    { props: { variant: "standard", severity: "info" }, style: severityStyle("info") },
    { props: { variant: "standard", severity: "success" }, style: severityStyle("success") },
    { props: { variant: "standard", severity: "warning" }, style: severityStyle("warning") },
    { props: { variant: "standard", severity: "error" }, style: severityStyle("error") },
    {
      props: { variant: "neutral" },
      style: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.border.solidStrong,
        boxShadow: outer.sm,
        color: theme.palette.text.primary,
        "& .MuiAlert-icon": { color: theme.palette.text.primary },
      }),
    },
  ],
  styleOverrides: {
    root: ({ theme }) => ({
      ...theme.typography.body1,
      alignItems: "flex-start",
      gap: theme.spacing(1),
      padding: theme.spacing(1),
      borderRadius: theme.spacing(1.5),
      border: "1px solid transparent",
    }),
    // MUI's 22px icon with 7px padding and a 12px margin makes the alert ~16px taller than Figma.
    icon: ({ theme }) => ({
      margin: 0,
      padding: 0,
      opacity: 1,
      flexShrink: 0,
      fontSize: theme.spacing(2),
      "& svg": { width: theme.spacing(2), height: theme.spacing(2) },
    }),
    message: ({ theme }) => ({
      flex: 1,
      minWidth: 0,
      padding: 0,
      overflow: "visible",
      color: "inherit",
      // Title + subtitle form: the message under the title is the overline subtitle. Default
      // body Typography inside it (as AppErrorAlert renders) follows, so it isn't a second title.
      "&:has(> .MuiAlertTitle-root)": {
        ...theme.typography.overline,
        color: theme.palette.text.secondary,
        "& .MuiTypography-body1:not(.MuiAlertTitle-root), & .MuiTypography-body2": {
          ...theme.typography.overline,
          color: theme.palette.text.secondary,
        },
      },
    }),
    action: ({ theme }) => ({
      alignItems: "center",
      alignSelf: "flex-start",
      gap: theme.spacing(0.5),
      padding: 0,
      margin: 0,
      marginLeft: "auto",
      // The close button is the Figma trail icon: 16px at the helper opacity.
      "& .MuiIconButton-root": {
        width: theme.spacing(2),
        height: theme.spacing(2),
        minWidth: 0,
        padding: 0,
        borderRadius: theme.spacing(0.5),
        color: "inherit",
        opacity: theme.palette.opacity.helper,
        "&:hover": { opacity: 1, backgroundColor: "transparent" },
        "& svg": { width: theme.spacing(2), height: theme.spacing(2) },
      },
    }),
  },
})
