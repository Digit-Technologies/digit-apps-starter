import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

import { neutralAlpha } from "../theme/colors"

export interface EmptyStateProps {
  /** An illustration (128px in the mockups) or an icon, shown left of the text. */
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** At most one button. Use a secondary button unless it is the only way forward. */
  actions?: ReactNode
}

/**
 * The mockup empty state (Settings › Integrations, 25510:179859): a tinted box at the content
 * width (paper/background/alpha/primary, radius 16, py 32, px 16) holding the icon and a 256px
 * left-aligned text column, centred as a group with a 32 gap. Title is body2 secondary, the
 * description body1 tertiary (8 below), then the action (16 below). It sits where the content
 * would be.
 */
export const EmptyState = ({ icon, title, description, actions }: EmptyStateProps) => (
  <Box
    sx={(theme) => ({
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      py: 4,
      px: 2,
      width: "100%",
      boxSizing: "border-box",
      borderRadius: theme.spacing(2),
      backgroundColor: neutralAlpha.darken[25],
      ...theme.applyStyles("dark", { backgroundColor: neutralAlpha.lighten[25] }),
    })}
  >
    {icon && (
      <Box sx={{ display: "flex", flexShrink: 0, color: "text.secondary" }}>{icon}</Box>
    )}
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        width: (theme) => theme.spacing(32),
        maxWidth: "100%",
        textAlign: "left",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="body2" component="h2" sx={{ m: 0, color: "text.secondary" }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" sx={{ color: "text.tertiary" }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions}
    </Box>
  </Box>
)
