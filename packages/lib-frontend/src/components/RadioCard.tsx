import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Radio from "@mui/material/Radio"
import { useRadioGroup } from "@mui/material/RadioGroup"
import Typography from "@mui/material/Typography"

export interface RadioCardProps {
  value: string
  icon?: ReactNode
  title: string
  description?: string
  disabled?: boolean
}

/**
 * One option in a choice that needs a sentence to explain each side, such as "Just me" or
 * "Entire org". Place it inside a MUI `RadioGroup row`, which owns the value.
 */
export const RadioCard = ({ value, icon, title, description, disabled }: RadioCardProps) => {
  const group = useRadioGroup()
  const checked = group?.value === value

  return (
    <Box
      component="label"
      sx={(theme) => ({
        flex: 1,
        display: "block",
        cursor: disabled ? "default" : "pointer",
        p: 1.5,
        borderRadius: "12px",
        border: `1px solid ${checked ? theme.palette.border.extrastrong : theme.palette.border.strong}`,
        backgroundColor: theme.palette.background.paper,
        opacity: disabled ? 0.5 : 1,
        "&:hover": { backgroundColor: disabled ? undefined : theme.palette.action.hover },
        "&:has(input:focus-visible)": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {icon && (
          <Box component="span" sx={{ display: "inline-flex", color: "text.primary" }}>
            {icon}
          </Box>
        )}
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          {title}
        </Typography>
        <Radio value={value} disabled={disabled} disableRipple sx={{ ml: "auto", p: 0 }} />
      </Box>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  )
}
