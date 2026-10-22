import { Theme } from "@mui/material/styles"

export const defaultTransition = (
  theme: Theme,
  props: string[] = ["all"],
): string =>
  theme.transitions.create(props, {
    duration: 20,
    easing: theme.transitions.easing.easeIn,
  })
