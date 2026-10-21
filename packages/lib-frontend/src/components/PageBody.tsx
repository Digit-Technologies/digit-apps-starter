import React, { ReactNode } from "react"

import Box from "@mui/material/Box"

export interface PageBodyProps {
  /**
   * Caps the content width in px, such as 720 for a settings page or a form. Leave it out for
   * content that should use the full width (dashboards, grids of cards).
   */
  maxWidth?: number
  /** Stacks of `Section`s, cards, a `PropertyGrid`, an `AppErrorAlert` or an `EmptyState`. */
  children: ReactNode
}

/**
 * Content under a `PageHeader` that is not a full-bleed `Table`. It applies the page gutter
 * (36px, and 20px below 600px, the same as `PageHeader` and `Table`), 24px above and below, and
 * stacks its children 32px apart. Use it instead of padding a `Box` by hand: `px: 4.5` alone
 * comes out at 45px on mobile, where the spacing base is 10px.
 */
export const PageBody = ({ maxWidth, children }: PageBodyProps) => (
  <Box
    sx={{
      px: { xs: 2, sm: 4.5 },
      py: 3,
      // The cap is for the content, so the two 36px gutters are added on top.
      maxWidth: maxWidth === undefined ? undefined : maxWidth + 72,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}
  >
    {children}
  </Box>
)
