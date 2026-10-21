import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

export interface SectionProps {
  title: ReactNode
  /**
   * Overline tertiary text beside the title: a count ("4 active") or a hint ("Shared with
   * customer"). Use `subtitlePlacement="below"` for a one-line description under the title.
   */
  subtitle?: ReactNode
  subtitlePlacement?: "inline" | "below"
  /** Right side: a text "View all" button, or 28px Plus / Ellipsis icon buttons. */
  actions?: ReactNode
  /** Heading element for the title. */
  component?: React.ElementType
  /** Content under the heading row, 16px below it. */
  children?: ReactNode
}

/**
 * The heading row of a page, card or panel section (Figma Home 16450:66089, record card
 * 22707:3899, Integrations 25510:179859): a 28px row with an h6 title, an overline tertiary
 * subtitle or count 8px after it, and actions on the right.
 */
export const Section = ({
  title,
  subtitle,
  subtitlePlacement = "inline",
  actions,
  component = "h3",
  children,
}: SectionProps) => {
  const below = subtitlePlacement === "below"
  const header = (
    <Box className="Section-header" sx={{ display: "flex", alignItems: "center", gap: 2, minHeight: 28 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: below ? "column" : "row",
          alignItems: below ? "flex-start" : "baseline",
          gap: below ? 0.5 : 1,
          minWidth: 0,
          flex: 1,
        }}
      >
        <Typography variant="h6" component={component} noWrap={!below}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="overline" color="text.tertiary" component="span" noWrap={!below}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>{actions}</Box>}
    </Box>
  )

  if (!children) return header

  return (
    <Box className="Section-root" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {header}
      {children}
    </Box>
  )
}
