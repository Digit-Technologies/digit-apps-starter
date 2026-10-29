import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

import { neutralAlpha } from "../theme/colors.js"

import { sectionClassName } from "./Section.js"

// `meta` may be a fragment or an array; each child of either is one item. Children.toArray does
// not look inside fragments, so they are unwrapped here.
const flattenFragments = (node: ReactNode): ReactNode[] =>
  React.Children.toArray(node).flatMap((child) =>
    React.isValidElement<{ children?: ReactNode }>(child) && child.type === React.Fragment
      ? flattenFragments(child.props.children)
      : [child],
  )

export interface RecordCardProps {
  /** The record's name, such as "Sales order SO-1234". Renders as h2 in the title row. */
  title?: ReactNode
  /**
   * Facts after the title, 16px apart: owner (16px avatar + name), date, and so on. Pass a
   * fragment or an array; each child is one item.
   */
  meta?: ReactNode
  /** The record's `StatusPill`, after the meta items. */
  status?: ReactNode
  /** Right side of the title row. Record actions usually live in the page header or panel. */
  actions?: ReactNode
  /** Max width in px. */
  maxWidth?: number
  /** `Section` children. Each becomes a band: 16px above and below, 36px at the sides. */
  children?: ReactNode
}

/**
 * The document card of a single record page (Figma SO record 22707:3899). Place it in a
 * scrolling column on `background.secondary`, under `PageHeader variant="record"`: white,
 * max 850px wide and centred, 16px from the header and 36px from the bottom, radius 16.
 * Its direct `Section` children are bands: 16px vertical and 36px side padding (20px below
 * 600px), the title 8px above the content, and a solid line under each one but the last.
 */
export const RecordCard = ({
  title,
  meta,
  status,
  actions,
  maxWidth = 850,
  children,
}: RecordCardProps) => (
  <Box
    component="article"
    className="RecordCard-root"
    sx={(theme) => ({
      boxSizing: "border-box",
      width: "100%",
      maxWidth,
      mx: "auto",
      mt: 2,
      mb: 4.5,
      py: 2,
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.border.strong}`,
      borderRadius: "16px",
      boxShadow: `0 1px 1px ${neutralAlpha.darken[50]}`,
      [`& > .${sectionClassName}`]: {
        gap: 1,
        py: 2,
        px: "36px",
        borderBottom: `1px solid ${theme.palette.border.solidDefault}`,
        "&:last-child": { borderBottom: "none" },
        "@media (max-width: 599px)": { px: "20px" },
      },
    })}
  >
    {(title || meta || status || actions) && (
      <Box
        className="RecordCard-title"
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: "36px",
          pb: 2,
          borderBottom: `1px solid ${theme.palette.border.default}`,
          "@media (max-width: 599px)": { px: "20px" },
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", columnGap: 2, rowGap: 1, minWidth: 0, flex: 1 }}>
          {title && (
            <Typography variant="h2" component="h2" sx={{ minWidth: 0 }}>
              {title}
            </Typography>
          )}
          {flattenFragments(meta).map((item, index) =>
            item === null || item === undefined || item === false ? null : (
              <Box key={index} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, minHeight: 28 }}>
                {typeof item === "string" || typeof item === "number" ? (
                  <Typography variant="body1" color="text.primary" component="span">
                    {item}
                  </Typography>
                ) : (
                  item
                )}
              </Box>
            ),
          )}
          {status && <Box sx={{ display: "inline-flex", alignItems: "center", minHeight: 28 }}>{status}</Box>}
        </Box>
        {actions && <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>{actions}</Box>}
      </Box>
    )}
    {children}
  </Box>
)
