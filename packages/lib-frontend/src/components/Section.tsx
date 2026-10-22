import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import { SxProps, Theme } from "@mui/material/styles"
import Typography from "@mui/material/Typography"

// A container (Modal, SidePanel, RecordCard) targets its direct Sections through these classes
// to lay them out as padded bands with a line between them.
export const sectionClassName = "digit-Section"
export const sectionHeaderClassName = "digit-Section-header"

export interface SectionProps {
  title?: ReactNode
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
  sx?: SxProps<Theme>
}

/**
 * A titled block of content: a 28px heading row (h6 title, an overline tertiary subtitle or count
 * 8px after it, and actions on the right) with the content 16px under it (Figma Home 16450:66089,
 * Integrations 25510:179859).
 *
 * On a page, stack Sections in a `PageBody`. Inside a `Modal`, `SidePanel` or `RecordCard`, pass
 * them as direct children: the container pads each one as a band with a line under it (Figma
 * Modal 10741:39951, record card 22707:3899). A band may leave out the title.
 */
export const Section = ({
  title,
  subtitle,
  subtitlePlacement = "inline",
  actions,
  component = "h3",
  children,
  sx,
}: SectionProps) => {
  const below = subtitlePlacement === "below"

  return (
    <Box
      className={sectionClassName}
      sx={[{ display: "flex", flexDirection: "column", gap: 2 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {(title || subtitle || actions) && (
        <Box className={sectionHeaderClassName} sx={{ display: "flex", alignItems: "center", gap: 2, minHeight: 28 }}>
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
            {title && (
              <Typography variant="h6" component={component} noWrap={!below}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="overline" color="text.tertiary" component="span" noWrap={!below}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>{actions}</Box>}
        </Box>
      )}
      {children}
    </Box>
  )
}
