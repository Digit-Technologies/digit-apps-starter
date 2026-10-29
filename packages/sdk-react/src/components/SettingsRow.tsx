import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

import { Info } from "../icons.js"

export interface SettingsRowProps {
  /**
   * `list` is a clickable row with a divider, for grants, checkboxes and switches. `setting` is a
   * settings-page row: label and description on the left, the control in a fixed right column.
   * For a label beside a form field, use `FormField horizontal`.
   */
  variant: "list" | "setting"
  label: ReactNode
  /** Tertiary overline text under the label, such as what the setting changes. */
  description?: ReactNode
  /** Tooltip text. Renders an info icon after the label. */
  info?: string
  required?: boolean
  /** The control: a Switch, Checkbox, Select or field. */
  control: ReactNode
  /** Setting rows only. Width of the right control column in px. */
  controlWidth?: number
}

const MOBILE = "@media (max-width: 599px)"

/**
 * One row in a settings panel.
 *
 * - `list` wraps its label in a `label` element, so clicking the text toggles the control. 36px
 *   rows with a full-width divider.
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
  controlWidth = 256,
}: SettingsRowProps) => {
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
        {control}
      </Box>
    )
  }

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
        {control}
      </Box>
    </Box>
  )
}
