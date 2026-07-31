import { Theme } from "@mui/material/styles"

export const defaultTransition = (
  theme: Theme,
  props: string[] = ["all"],
): string =>
  theme.transitions.create(props, {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut,
  })
