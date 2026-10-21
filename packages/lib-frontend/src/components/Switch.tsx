import React, { ReactNode, useId } from "react"

import Box from "@mui/material/Box"
import MuiSwitch from "@mui/material/Switch"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"

import { Info } from "../icons"

export interface SwitchProps {
  /** The label. Sits on the left, with the switch on the right and a gap between them. */
  label: ReactNode
  /** A short line under the label (overline, tertiary), as on settings rows. */
  description?: ReactNode
  /** Tooltip text. Renders an info icon after the label. */
  info?: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void
}

/**
 * An on or off setting with its label. The label is clickable, and the label and the switch keep
 * a gap between them, as the platform does. Use it instead of a bare MUI Switch next to text.
 */
export const Switch = ({
  label,
  description,
  info,
  checked,
  defaultChecked,
  disabled,
  onChange,
}: SwitchProps) => {
  const descriptionId = useId()

  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <Typography
          variant="body1"
          color="text.primary"
          component="span"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
        >
          {label}
          {info && (
            <Tooltip title={info}>
              <Box component="span" sx={{ color: "text.tertiary", display: "inline-flex" }}>
                <Info size={12} />
              </Box>
            </Tooltip>
          )}
        </Typography>
        {description && (
          <Typography id={descriptionId} variant="overline" color="text.tertiary" component="span">
            {description}
          </Typography>
        )}
      </Box>
      <MuiSwitch
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={onChange}
        slotProps={description ? { input: { "aria-describedby": descriptionId } } : undefined}
        sx={{ flexShrink: 0 }}
      />
    </Box>
  )
}
