import React, { ReactElement, ReactNode, cloneElement, isValidElement, useId } from "react"

import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"

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
  /**
   * The id given to the control, so the label points at it. Defaults to a generated id. A child
   * that already has an `id` keeps it, and the label uses that id instead.
   */
  id?: string
  /** One control, usually a themed TextField, Select, or Checkbox. */
  children: ReactNode
}

type ControlProps = {
  id?: string
  error?: boolean
  "aria-describedby"?: string
  slotProps?: { htmlInput?: Record<string, unknown> } & Record<string, unknown>
}

/**
 * Wraps one form control with its label, helper text, and error text. The control is passed in
 * as a child, so the same wrapper works with MUI's Select, TextField, and Checkbox. FormField
 * gives the child an id that the label points at, links the message to it with
 * aria-describedby, and sets `error` on it when there is error text. It holds no state.
 */
export const FormField = ({
  label,
  required,
  helperText,
  error,
  horizontal,
  id,
  children,
}: FormFieldProps) => {
  const theme = useTheme()
  const generatedId = useId()
  const messageId = useId()
  const message = error ?? helperText
  const describedBy = message ? messageId : undefined

  const child = isValidElement<ControlProps>(children) ? (children as ReactElement<ControlProps>) : null
  const controlId = child?.props.id ?? id ?? generatedId

  let control: ReactNode = children
  if (child) {
    const extra: ControlProps = { id: controlId }
    if (error) extra.error = true
    if (describedBy) {
      // A TextField puts its own props on the wrapper div, so the description goes on the input.
      if (child.type === TextField) {
        extra.slotProps = {
          ...child.props.slotProps,
          htmlInput: { ...child.props.slotProps?.htmlInput, "aria-describedby": describedBy },
        }
      } else {
        extra["aria-describedby"] = describedBy
      }
    }
    control = cloneElement(child, extra)
  }

  // Figma label/Sm above the field (4px gap), or in a 128px column beside it (form/label-field/
  // width md, 8px gap). The 8px inset lines the label and message up with the text in the field.
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: horizontal ? `${theme.spacing(16)} minmax(0, 1fr)` : "minmax(0, 1fr)",
        alignItems: horizontal ? "start" : undefined,
        gap: horizontal ? 1 : 0.5,
      }}
    >
      <Typography
        variant="body1"
        component="label"
        htmlFor={controlId}
        color="text.primary"
        // Beside a 28px field, the 16px label sits on the field's text line.
        sx={{ px: 1, pt: horizontal ? 0.75 : 0, overflowWrap: "anywhere" }}
      >
        {label}
        {required && " *"}
      </Typography>
      <Box sx={{ minWidth: 0 }}>
        {control}
        {message && (
          <Typography
            id={messageId}
            variant="body2"
            component="p"
            sx={{
              mt: 0.5,
              px: 1,
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
