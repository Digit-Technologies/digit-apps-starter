import React, { ReactNode, useId, useState } from "react"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import Button from "@mui/material/Button"
import Collapse from "@mui/material/Collapse"
import Typography from "@mui/material/Typography"

import { ChevronDown } from "../icons"
import { focusRing } from "../theme/focus"

export interface SettingsSectionProps {
  title: ReactNode
  /** Overline tertiary hint after the title, such as "Shared with your workspace". */
  subtitle?: ReactNode
  /** Starts expanded unless false. */
  defaultOpen?: boolean
  /** False renders a plain title with no chevron, as in the settings General page. */
  collapsible?: boolean
  /**
   * `md` (default): h5 title on a 40px header, rows directly under it (permission groups).
   * `sm`: h6 title on a 28px header and a 16px gap before the rows (side panel sections).
   */
  size?: "md" | "sm"
  /** Pads the section 16px and draws a solid bottom line (none on the last section). */
  padded?: boolean
  /** Adds a Select All / Deselect All action. Pass it when the rows are grants or checkboxes. */
  selection?: { checked: number; total: number; onChange: (selectAll: boolean) => void }
  /** Right side of the header, after the selection action: a Plus `IconButton` or a "New" button. */
  action?: ReactNode
  /** SettingsRow rows. */
  children: ReactNode
}

/**
 * A group of settings rows under a header (ChevronDown 16 + title). List rows indent under the
 * title and their dividers run full width; form and setting rows keep their own alignment.
 */
export const SettingsSection = ({
  title,
  subtitle,
  defaultOpen = true,
  collapsible = true,
  size = "md",
  padded = false,
  selection,
  action,
  children,
}: SettingsSectionProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  const isOpen = collapsible ? open : true
  const isSmall = size === "sm"
  const allChecked =
    selection !== undefined && selection.total > 0 && selection.checked === selection.total

  const heading = (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline", gap: 1, minWidth: 0 }}>
      <Typography variant={isSmall ? "h6" : "h5"} component="h2" noWrap>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="overline" color="text.tertiary" component="span" noWrap>
          {subtitle}
        </Typography>
      )}
    </Box>
  )

  return (
    <Box
      className="SettingsSection-root"
      sx={(theme) =>
        padded
          ? {
              p: 2,
              borderBottom: `1px solid ${theme.palette.border.solidDefault}`,
              "&:last-child": { borderBottom: "none" },
            }
          : {}
      }
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          minHeight: isSmall ? 28 : 40,
        }}
      >
        {collapsible ? (
          <ButtonBase
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={bodyId}
            sx={(theme) => ({
              gap: 1,
              minWidth: 0,
              borderRadius: "8px",
              justifyContent: "flex-start",
              "&.Mui-focusVisible": { boxShadow: focusRing(theme) },
            })}
          >
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                color: "text.primary",
                transform: open ? "none" : "rotate(-90deg)",
                transition: "transform 150ms ease",
              }}
            >
              <ChevronDown size={16} />
            </Box>
            {heading}
          </ButtonBase>
        ) : (
          heading
        )}
        {(selection || action) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
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
            {action}
          </Box>
        )}
      </Box>
      <Collapse in={isOpen} id={bodyId}>
        <Box
          sx={{
            pt: isSmall ? 2 : 0,
            "& .SettingsRow-list": { pl: 4.5 },
            // Setting rows sit 16px apart; keep the same gap to anything else in the section,
            // such as a PropertyGrid under "Entity custom fields".
            "& > .SettingsRow-setting + :not(.SettingsRow-root), & > :not(.SettingsRow-root) + .SettingsRow-setting": { mt: 2 },
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Box>
  )
}
