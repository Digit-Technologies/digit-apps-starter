import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

import { Info } from "../icons"

export interface SettingsRowProps {
  /** `list` is a clickable row with a divider, for grants and checkboxes. `form` is a label beside its field. */
  variant: "list" | "form"
  label: ReactNode
  /** Tooltip text. Renders an info icon after the label. */
  info?: string
  required?: boolean
  /** The control. Children work too, so `<SettingsRow>` can wrap a field directly. */
  control?: ReactNode
  children?: ReactNode
  /** Form rows only. Width of the label column in px. */
  labelWidth?: number
}

/**
 * One row in a settings panel or a form. The `list` row wraps its label in a `label` element,
 * so clicking the text toggles the control. The `form` row puts the label in a fixed column.
 */
export const SettingsRow = ({
  variant,
  label,
  info,
  required,
  control,
  children,
  labelWidth = 120,
}: SettingsRowProps) => {
  const field = control ?? children
  const labelNode = (
    <Typography variant="body1" color="text.primary" component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      {label}
      {required && " *"}
      {info && (
        <Tooltip title={info}>
          <Box component="span" sx={{ color: "text.tertiary", display: "inline-flex" }}>
            <Info size={14} />
          </Box>
        </Tooltip>
      )}
    </Typography>
  )

  if (variant === "list") {
    return (
      <Box
        component="label"
        className="SettingsRow-root"
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 36,
          pr: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          cursor: "pointer",
        })}
      >
        {labelNode}
        {field}
      </Box>
    )
  }

  return (
    <Box
      className="SettingsRow-root"
      sx={{
        display: "grid",
        gridTemplateColumns: `${labelWidth}px 1fr`,
        alignItems: "center",
        gap: 1,
        minHeight: 32,
      }}
    >
      {labelNode}
      <Box sx={{ minWidth: 0 }}>{field}</Box>
    </Box>
  )
}
