import { Components, Theme } from "@mui/material/styles"

import { outer } from "./shadows"

// Figma Snackbar (10381:24686): one row of [icon 16 + body1 text] [xs text Button] [xs close
// IconButton], padding 8, gap 8, radius 12, a.10 / w.10 border, outer/md, paper fill.
const snackbarSurface = (theme: Theme) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.border.strong}`,
  borderRadius: theme.spacing(1.5),
  boxShadow: outer.md,
  color: theme.palette.text.primary,
})

// The Figma action and close controls are always the xs size, whatever size the caller passes.
const xsControls = (theme: Theme) => ({
  "& .MuiButton-root": {
    height: theme.spacing(2.5),
    minWidth: theme.spacing(2.5),
    padding: `0 ${theme.spacing(0.5)}`,
    borderRadius: theme.spacing(0.75),
  },
  "& .MuiIconButton-root": {
    width: theme.spacing(2.5),
    height: theme.spacing(2.5),
    minWidth: theme.spacing(2.5),
    padding: 0,
    borderRadius: theme.spacing(0.75),
    "& svg": { width: theme.spacing(2), height: theme.spacing(2) },
  },
})

export const muiSnackbarContent = (): Components<
  Omit<Theme, "components">
>["MuiSnackbarContent"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      ...snackbarSurface(theme),
      // MUI sets body2 (500 here); Figma's snackbar text is body1 400.
      ...theme.typography.body1,
      flexWrap: "nowrap",
      gap: theme.spacing(1),
      padding: theme.spacing(1),
      // Hug the content as in Figma rather than MUI's 288px minimum.
      [theme.breakpoints.up("sm")]: { minWidth: 0 },
    }),
    message: ({ theme }) => ({
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(0.5),
      padding: 0,
      "& > svg": { width: theme.spacing(2), height: theme.spacing(2), flexShrink: 0 },
    }),
    action: ({ theme }) => ({
      gap: theme.spacing(1),
      margin: 0,
      padding: 0,
      ...xsControls(theme),
    }),
  },
})

// `<Snackbar><Alert severity="success" onClose={…}>…</Alert></Snackbar>` is the usual MUI
// pattern. A standard Alert in a snackbar drops its tint for the snackbar surface and keeps only
// the severity icon colour, as Figma's snackbar variants do.
export const muiSnackbar = (): Components<Omit<Theme, "components">>["MuiSnackbar"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      "& > .MuiAlert-standard, & > .MuiAlert-neutral": {
        ...snackbarSurface(theme),
        alignItems: "center",
        "& .MuiAlert-message": { ...theme.typography.body1 },
        "& .MuiAlert-action": {
          alignSelf: "center",
          gap: theme.spacing(1),
          ...xsControls(theme),
          "& .MuiIconButton-root": { opacity: 1 },
        },
      },
    }),
  },
})
