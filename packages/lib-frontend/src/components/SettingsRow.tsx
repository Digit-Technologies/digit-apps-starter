import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

import { Info } from "../icons"

export interface SettingsRowProps {
  /**
   * `list` is a clickable row with a divider, for grants and checkboxes. `form` is a label in a
   * fixed left column beside its field (side panels, form dialogs). `setting` is a settings-page
   * row: label and description on the left, the control in a fixed right column.
   */
  variant: "list" | "form" | "setting"
  label: ReactNode
  /** Tertiary overline text under the label, such as what the setting changes. */
  description?: ReactNode
  /** Tooltip text. Renders an info icon after the label. */
  info?: string
  required?: boolean
  /** The control. Children work too, so `<SettingsRow>` can wrap a field directly. */
  control?: ReactNode
  children?: ReactNode
  /** Form rows only. Width of the label column in px. Figma form/label-field/width md is 128. */
  labelWidth?: number
  /** Setting rows only. Width of the right control column in px. */
  controlWidth?: number
}

const MOBILE = "@media (max-width: 599px)"

/**
 * One row in a settings panel or a form.
 *
 * - `list` wraps its label in a `label` element, so clicking the text toggles the control. 36px
 *   rows with a full-width divider.
 * - `form` puts the label in a 128px column with an 8px inset, so it lines up with the text of an
 *   invisible input. Controls are 28px; consecutive rows sit at a 36px pitch.
 * - `setting` (Figma settings General, 25394:7867): label + description take the free width, the
 *   control sits in a 256px column on the right, 16px apart, centred. Rows sit 16px apart.
 *
 * Inside a `Stack spacing` the Stack's spacing wins over the built-in row pitch.
 */
export const SettingsRow = ({
  variant,
  label,
  description,
  info,
  required,
  control,
  children,
  labelWidth = 128,
  controlWidth = 256,
}: SettingsRowProps) => {
  const field = control ?? children
  const labelNode = (
    <Typography variant="body1" color="text.primary" component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      {label}
      {required && " *"}
      {info && (
        <Tooltip title={info}>
          <Box component="span" sx={{ color: "text.tertiary", display: "inline-flex" }}>
            <Info size={12} />
          </Box>
        </Tooltip>
      )}
    </Typography>
  )
  const labelBlock = description ? (
    <Box sx={{ display: "flex", flexDirection: "column", gap: variant === "setting" ? 1 : 0.5, minWidth: 0 }}>
      {labelNode}
      <Typography variant="overline" color="text.tertiary" component="span">
        {description}
      </Typography>
    </Box>
  ) : (
    labelNode
  )

  if (variant === "list") {
    return (
      <Box
        component="label"
        className="SettingsRow-root SettingsRow-list"
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          minHeight: 36,
          pr: 1,
          borderBottom: `1px solid ${theme.palette.border.default}`,
          cursor: "pointer",
        })}
      >
        {labelBlock}
        {field}
      </Box>
    )
  }

  if (variant === "setting") {
    return (
      <Box
        className="SettingsRow-root SettingsRow-setting"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          // Zero-specificity pitch, so a parent Stack's spacing still wins.
          "&:where(.SettingsRow-setting + .SettingsRow-setting)": { mt: 2 },
          [MOBILE]: { flexWrap: "wrap" },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>{labelBlock}</Box>
        <Box
          sx={{
            flex: `0 0 ${controlWidth}px`,
            width: controlWidth,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            minHeight: 28,
            [MOBILE]: { flexBasis: "100%", width: "100%" },
          }}
        >
          {field}
        </Box>
      </Box>
    )
  }

  return (
    <Box
      className="SettingsRow-root SettingsRow-form"
      sx={{
        display: "grid",
        gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)`,
        // Top-aligned, with the label pushed down to the first text line of a 28px control, so
        // the label stays beside the first line of a multiline field.
        alignItems: "start",
        gap: 1,
        // The 8px inset lines the label up with the text of an invisible input below or beside it.
        pl: 1,
        minHeight: 28,
        // 28px rows at a 36px pitch. Zero-specificity, so a parent Stack's spacing still wins.
        "&:where(.SettingsRow-form + .SettingsRow-form)": { mt: 1 },
      }}
    >
      <Box sx={{ pt: 0.75, minWidth: 0 }}>{labelBlock}</Box>
      <Box sx={{ minWidth: 0 }}>{field}</Box>
    </Box>
  )
}
