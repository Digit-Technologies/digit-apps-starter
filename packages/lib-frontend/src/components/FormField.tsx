import React, { ReactNode, useId } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

export interface FormFieldProps {
  /** The visible label above the control, or beside it when `horizontal`. */
  label: ReactNode
  /** Appends " *" to the label. */
  required?: boolean
  /** Helper text under the control. */
  helperText?: ReactNode
  /** Error text under the control. Replaces the helper text and turns red. */
  error?: ReactNode
  /** Puts the label in a left column, with the control on the right. */
  horizontal?: boolean
  /** The control, usually a themed TextField, Select, or Checkbox. */
  children: ReactNode
}

/**
 * Wraps one form control with its label, helper text, and error text. The control is passed in
 * as a child, so the same wrapper works with MUI's Select, TextField, and Checkbox. This is a
 * presentational wrapper, not a form library binding: it holds no state.
 */
export const FormField = ({
  label,
  required,
  helperText,
  error,
  horizontal,
  children,
}: FormFieldProps) => {
  const messageId = useId()
  const message = error ?? helperText

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: horizontal ? "120px 1fr" : "1fr",
        alignItems: horizontal ? "start" : undefined,
        gap: horizontal ? 1 : 0.5,
      }}
    >
      <Typography
        variant="subtitle2"
        component="label"
        color="text.primary"
        sx={{ pt: horizontal ? 1 : 0 }}
      >
        {label}
        {required && " *"}
      </Typography>
      <Box sx={{ minWidth: 0 }} aria-describedby={message ? messageId : undefined}>
        {children}
        {message && (
          <Typography
            id={messageId}
            variant="body2"
            component="p"
            sx={{
              mt: 0.5,
              fontSize: "12px",
              lineHeight: "16px",
              fontWeight: 400,
              color: error ? "error.main" : "text.secondary",
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
