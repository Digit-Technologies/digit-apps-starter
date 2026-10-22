import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"

import { ChevronRight } from "../icons"

export interface Crumb {
  label: string
  onClick?: () => void
}

export interface PageHeaderProps {
  title: string
  /** Parent crumbs. When set, `title` renders as the current crumb. */
  trail?: Crumb[]
  /** Caption shown inline after the title, such as "Let's get Acme set up". */
  subtitle?: ReactNode
  /** Sits right after the title with an 8px gap, such as a Beta or Custom `Chip`. */
  titleAdornment?: ReactNode
  /**
   * Right side. Order them from least to most used: LearningCenter and Star icon buttons, then
   * secondary buttons, then ONE contained primary button, last.
   */
  actions?: ReactNode
  /** MUI Tabs, under the title row and above the divider. */
  tabs?: ReactNode
  /**
   * `page` for list and index screens. `record` for a single record under a list: same bar on
   * the secondary page background, usually with `trail`.
   */
  variant?: "page" | "record"
}

// Figma page/padding/x/default is 36px on desktop and 20px below 600px. It is its own token, so it
// is set in px rather than scaled with the spacing base.
const PAGE_GUTTER = "36px"
const PAGE_GUTTER_MOBILE = "20px"
const MOBILE = "@media (max-width: 599px)"

/**
 * The title row at the top of a screen (Figma appBar 11800:69168). For the header of a dialog
 * or side panel, use `Modal` or `SidePanel`, which draw their own.
 *
 * - Page: 60px bar, 36px side padding, solid bottom line, h5 title.
 * - With `tabs`: the title row is 52px (pt 16, pb 8) and the tab row sits under it; there is one
 *   line, under the tabs.
 * - `variant="record"`: the breadcrumb header of a single record (11829:51332), on
 *   `background.secondary`. Pass `trail` for the parent list.
 *
 * Action order, left to right, runs from least used to most used: LearningCenter
 * (`BookOpenText`) and Star icon buttons, then secondary buttons, then one primary button last.
 */
export const PageHeader = ({
  title,
  trail,
  subtitle,
  titleAdornment,
  actions,
  tabs,
  variant = "page",
}: PageHeaderProps) => {
  // A crumb is a text button with 8px padding. The row starts 8px early so the first crumb's
  // label sits on the 36px gutter (Figma page/padding/x/minus-input-padding, 28px).
  const startsWithCrumb = Boolean(trail?.length)

  const titleNode = trail ? (
    <Box component="nav" aria-label="Breadcrumb" sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
      {trail.map((crumb, index) => (
        <React.Fragment key={`${crumb.label}-${index}`}>
          {crumb.onClick ? (
            <Button
              variant="text"
              size="small"
              color="inherit"
              onClick={crumb.onClick}
              sx={{ height: 28, minWidth: 0, px: 1, borderRadius: "8px", flexShrink: 0 }}
            >
              <Typography variant="subtitle2" color="text.primary" component="span" noWrap>
                {crumb.label}
              </Typography>
            </Button>
          ) : (
            <Typography variant="subtitle2" color="text.primary" component="span" noWrap sx={{ px: 1 }}>
              {crumb.label}
            </Typography>
          )}
          <Box component="span" aria-hidden sx={{ opacity: (theme) => theme.palette.opacity.helper, display: "inline-flex" }}>
            <ChevronRight size={16} />
          </Box>
        </React.Fragment>
      ))}
      {/* The current crumb is the page's heading: a disabled text button in Figma, tertiary label. */}
      <Typography variant="subtitle2" color="text.tertiary" component="h1" aria-current="page" noWrap sx={{ px: 1, m: 0 }}>
        {title}
      </Typography>
    </Box>
  ) : (
    <Typography variant="h5" component="h1" noWrap>
      {title}
    </Typography>
  )

  return (
    <Box
      className="PageHeader-root"
      sx={(theme) => ({
        backgroundColor: variant === "record" ? theme.palette.background.secondary : undefined,
        borderBottom: `1px solid ${theme.palette.border.solidStrong}`,
      })}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          boxSizing: "border-box",
          // 60px bar; 52px (16 + 28 + 8) title row when tabs follow.
          minHeight: tabs ? 52 : 60,
          pl: startsWithCrumb ? 3.5 : PAGE_GUTTER,
          pr: PAGE_GUTTER,
          pt: 2,
          pb: tabs ? 1 : 2,
          // Below 600px the spacing base is 10px, so pt and pb already grow to 20 and 10. Only the
          // page gutter needs its own value.
          [MOBILE]: { pl: startsWithCrumb ? 1 : PAGE_GUTTER_MOBILE, pr: PAGE_GUTTER_MOBILE },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, maxWidth: "100%" }}>
            {titleNode}
            {titleAdornment && (
              <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                {titleAdornment}
              </Box>
            )}
          </Box>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" component="span" noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto", flexShrink: 0 }}>{actions}</Box>
      </Box>
      {tabs && (
        <Box
          sx={{
            px: PAGE_GUTTER,
            [MOBILE]: { px: PAGE_GUTTER_MOBILE },
            // The header draws the one line under the tabs, so the Tabs' own line is dropped.
            "& .MuiTabs-root": { borderBottom: "none" },
          }}
        >
          {tabs}
        </Box>
      )}
    </Box>
  )
}
