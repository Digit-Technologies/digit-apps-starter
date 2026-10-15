import { Components, Theme } from "@mui/material/styles"

export const textFieldDefaultVariant = "filled" as const

export const muiTextField = (): Components<
  Omit<Theme, "components">
>["MuiTextField"] => {
  return {
    defaultProps: {
      variant: textFieldDefaultVariant,
    },
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
