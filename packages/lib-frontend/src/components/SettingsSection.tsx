import React, { ReactNode, useId, useState } from "react"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import Button from "@mui/material/Button"
import Collapse from "@mui/material/Collapse"
import Typography from "@mui/material/Typography"

import { ChevronDown } from "../icons"

export interface SettingsSectionProps {
  title: string
  /** Starts expanded unless false. */
  defaultOpen?: boolean
  /** Adds a Select All / Deselect All action. Pass it when the rows are grants or checkboxes. */
  selection?: { checked: number; total: number; onChange: (selectAll: boolean) => void }
  /** SettingsRow variant="list" rows. */
  children: ReactNode
}

/**
 * A collapsible group of settings rows under a header. The rows indent under the title, and
 * the dividers run full width.
 */
export const SettingsSection = ({
  title,
  defaultOpen = true,
  selection,
  children,
}: SettingsSectionProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  const allChecked =
    selection !== undefined && selection.total > 0 && selection.checked === selection.total

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 40 }}>
        <ButtonBase
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={bodyId}
          sx={{ gap: 1, borderRadius: 1, justifyContent: "flex-start" }}
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              color: "text.secondary",
              transform: open ? "none" : "rotate(-90deg)",
              transition: "transform 150ms ease",
            }}
          >
            <ChevronDown size={16} />
          </Box>
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
        </ButtonBase>
        {selection && (
          <Button
            variant="text"
            color="inherit"
            size="small"
            onClick={() => selection.onChange(!allChecked)}
          >
            {allChecked ? "Deselect All" : "Select All"}
          </Button>
        )}
      </Box>
      <Collapse in={open} id={bodyId}>
        <Box sx={{ "& .SettingsRow-root": { pl: 4.5 } }}>{children}</Box>
      </Collapse>
    </Box>
  )
}
