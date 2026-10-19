import { Components, Theme } from "@mui/material/styles"

export const muiFormControlLabel = (): Components<
  Omit<Theme, "components">
>["MuiFormControlLabel"] => {
  return {
    styleOverrides: {
      root: {
        "& .MuiFormControlLabel-label": {
          fontSize: "0.8125rem", // body2
        },
      },
    },
  }
}
