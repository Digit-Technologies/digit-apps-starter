import { Components, Theme } from "@mui/material/styles"

export const muiAutocomplete = (): Components<
  Omit<Theme, "components">
>["MuiAutocomplete"] => {
  return {
    styleOverrides: {
      root: {
        fontSize: "0.8125rem", // body2
        "& ::placeholder": {
          fontSize: "0.8125rem", // body2
        },
      },
    },
  }
}
