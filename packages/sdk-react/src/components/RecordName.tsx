import React, { MouseEvent, ReactNode, useState } from "react"

import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import type { LucideIcon } from "lucide-react"

import { BoxIcon, Building2, CircleUserRound, FileText, Wrench } from "../icons.js"
import { focusRing } from "../theme/focus.js"

export type RecordNamePlaceholder = "item" | "company" | "user" | "tool" | "document"

/** One group in the meta line: a 12px icon, an optional label, then the value. */
export interface RecordNameMeta {
  icon?: LucideIcon
  /** Shown before the value, for example "SKU". Leave it out to show the icon and value only. */
  label?: string
  value: ReactNode
  /** Tooltip on hover, for groups that show no label. */
  tooltip?: string
}

export interface RecordNameProps {
  name: string
  image?: string
  /** The icon shown when there is no image, or the image fails to load. Defaults to "item". */
  placeholder?: RecordNamePlaceholder
  /** Usually a `StatusPill`, drawn beside the name. */
  status?: ReactNode
  /**
   * Second line under the name, which also switches to the 36px tile. Pass a list of groups, or
   * any node (12px icons inside it get a 4px gap; direct children sit 16px apart).
   */
  meta?: ReactNode | RecordNameMeta[]
  /** Makes the name a keyboard-accessible link button (body1Link, 600, underline on hover). */
  onClick?: (event: MouseEvent<HTMLElement>) => void
  /** Makes the name an anchor to this URL, styled like `onClick`. */
  href?: string
  /**
   * Styles the name as a link (600, underlines on row hover) without making it focusable. Use it
   * in a DataTable name column whose row already opens the record through `onRowClick`.
   * Defaults to true when `onClick` or `href` is given.
   */
  link?: boolean
}

const placeholderIcons: Record<RecordNamePlaceholder, LucideIcon> = {
  item: BoxIcon,
  company: Building2,
  user: CircleUserRound,
  tool: Wrench,
  // Anything that is not one of the above: notes, files, reports, runs.
  document: FileText,
}

// The DataGrid theme underlines this class when its row is hovered (muiDataGrid.ts).
const linkClassName = "digit-RecordName-link"

const isMetaList = (meta: RecordNameProps["meta"]): meta is RecordNameMeta[] =>
  Array.isArray(meta) && meta.every((group) => typeof group === "object" && group !== null && "value" in group)

/**
 * Figma itemAvatar (Molecules 10412:14013): a 20px tile and the name on one line, or a 36px tile
 * with the name, status and a meta line. Pass `link` (or `onClick` / `href`) for record names in
 * tables and lists, which Figma draws as 600 links.
 */
export const RecordName = ({
  name,
  image,
  placeholder = "item",
  status,
  meta,
  onClick,
  href,
  link,
}: RecordNameProps) => {
  const [failedImage, setFailedImage] = useState<string>()
  const Icon = placeholderIcons[placeholder]
  const large = Boolean(meta)
  const size = large ? 36 : 20
  const interactive = Boolean(onClick || href)
  const asLink = link ?? interactive
  const frame = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: "6px",
    border: 1,
    borderColor: "border.strong",
  }

  const nameNode = interactive ? (
    <Typography
      variant="body1Link"
      component={href ? "a" : "button"}
      {...(href ? { href } : { type: "button" })}
      onClick={onClick}
      className={linkClassName}
      noWrap
      sx={(theme) => ({
        display: "block",
        minWidth: 0,
        maxWidth: "100%",
        p: 0,
        m: 0,
        border: 0,
        background: "none",
        color: "text.primary",
        textAlign: "left",
        textDecoration: "none",
        cursor: "pointer",
        borderRadius: "2px",
        "&:focus-visible": { outline: "none", boxShadow: focusRing(theme) },
      })}
    >
      {name}
    </Typography>
  ) : (
    <Typography
      // With a meta line the name is 600 too (h6 is the same 13/16 600, without the hover).
      variant={asLink ? "body1Link" : large ? "h6" : "body1"}
      className={asLink ? linkClassName : undefined}
      color="text.primary"
      noWrap
      sx={{ minWidth: 0 }}
    >
      {name}
    </Typography>
  )

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
      {image && image !== failedImage ? (
        <Box
          component="img"
          src={image}
          alt=""
          onError={() => setFailedImage(image)}
          sx={{ ...frame, objectFit: "cover" }}
        />
      ) : (
        <Box
          sx={{
            ...frame,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: large ? "4px" : "2px",
            bgcolor: "background.paper",
            color: "text.secondary",
          }}
        >
          <Icon size={large ? 16 : 12} />
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          {nameNode}
          {status}
        </Box>
        {meta && (
          <Typography
            variant="overline"
            color="text.secondary"
            component="div"
            noWrap
            sx={{ minWidth: 0 }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                gap: "16px",
                minWidth: 0,
                "& svg": { flexShrink: 0, marginRight: "4px" },
              }}
            >
              {isMetaList(meta)
                ? meta.map(({ icon: GroupIcon, label, value, tooltip }, index) => {
                    const group = (
                      <Box
                        key={index}
                        component="span"
                        sx={{ display: "inline-flex", alignItems: "center", minWidth: 0 }}
                      >
                        {GroupIcon && <GroupIcon size={12} />}
                        {label && (
                          <Box component="span" sx={{ mr: 1 }}>
                            {label}
                          </Box>
                        )}
                        {value}
                      </Box>
                    )
                    return tooltip ? (
                      <Tooltip key={index} title={tooltip}>
                        {group}
                      </Tooltip>
                    ) : (
                      group
                    )
                  })
                : meta}
            </Stack>
          </Typography>
        )}
      </Box>
    </Box>
  )
}
