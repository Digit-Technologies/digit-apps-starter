import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  /** At most one action. Use a secondary button unless it is the only way forward. */
  action?: ReactNode
}

/** A centred block for a screen or list with nothing in it yet. */
export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      py: 6,
      gap: 1,
    }}
  >
    {icon}
    <Typography variant="h4" component="h2">
      {title}
    </Typography>
    {description && (
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        {description}
      </Typography>
    )}
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Box>
)
