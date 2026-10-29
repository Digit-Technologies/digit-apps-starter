import { Components, Theme } from "@mui/material/styles"

// MUI 9's Typography only resolves palette keys ("primary", "textSecondary") in its `color` prop.
// A palette path such as "text.secondary", "text.tertiary" or "error.main", which apps and the
// MUI docs both write, renders silently in the primary colour. Resolve those paths here.
const resolvePaletteColor = (theme: Theme, color: unknown): string | undefined => {
  if (typeof color !== "string" || !color.includes(".")) return undefined
  const value = color
    .split(".")
    .reduce<unknown>(
      (node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined),
      theme.palette,
    )
  return typeof value === "string" ? value : undefined
}

export const muiTypography = (): Components<Omit<Theme, "components">>["MuiTypography"] => ({
  styleOverrides: {
    root: ({ ownerState, theme }) => {
      const color = resolvePaletteColor(theme, ownerState.color)
      return color ? { color } : {}
    },
  },
})
