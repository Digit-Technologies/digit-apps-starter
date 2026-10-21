import { Components, Theme } from "@mui/material/styles"

// A checkbox, radio or switch with its label: body1 13/16 text 8px from the 16px control. MUI's
// -11px start margin assumes its 42px padded control, which the themed controls don't have.
export const muiFormControlLabel = (): Components<
  Omit<Theme, "components">
>["MuiFormControlLabel"] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      marginLeft: 0,
      marginRight: 0,
      gap: theme.spacing(1),
      "& .MuiFormControlLabel-label": {
        ...theme.typography.body1,
        color: theme.palette.text.primary,
      },
      "& .MuiFormControlLabel-label.Mui-disabled": {
        color: theme.palette.text.primary,
        opacity: theme.palette.opacity.disabled,
      },
    }),
    labelPlacementStart: { marginLeft: 0, marginRight: 0 },
    labelPlacementTop: { marginLeft: 0, marginRight: 0 },
    labelPlacementBottom: { marginLeft: 0, marginRight: 0 },
  },
})
