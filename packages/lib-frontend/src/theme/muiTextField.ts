import { Components, Theme } from "@mui/material/styles"

export const textFieldDefaultVariant = "filled" as const

// Figma has no floating labels: a label sits above the field (label/Sm, body1 13/16 400,
// text.primary) with an 8px inset that lines it up with the text inside the field, and a 4px gap,
// the same layout as FormField. So `<TextField label="Name">` renders that layout too. The label
// is always shrunk so MUI never hides the placeholder behind it.
export const muiTextField = (): Components<Omit<Theme, "components">>["MuiTextField"] => ({
  defaultProps: {
    variant: textFieldDefaultVariant,
    slotProps: { inputLabel: { shrink: true } },
  },
  styleOverrides: {
    root: ({ theme }) => ({
      "& .MuiInputLabel-root": {
        ...theme.typography.body1,
        position: "static",
        transform: "none",
        maxWidth: "100%",
        padding: theme.spacing(0, 1),
        marginBottom: theme.spacing(0.5),
        color: theme.palette.text.primary,
        pointerEvents: "auto",
        "&.Mui-focused, &.Mui-error": { color: theme.palette.text.primary },
        "&.Mui-disabled": { color: theme.palette.text.primary, opacity: theme.palette.opacity.disabled },
      },
      // Helper and error text, as FormField draws them.
      "& .MuiFormHelperText-root": {
        ...theme.typography.caption,
        margin: theme.spacing(0.5, 1, 0),
        color: theme.palette.text.secondary,
        "&.Mui-error": { color: theme.palette.error.main },
      },
    }),
  },
})
