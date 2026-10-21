import React, { ReactNode, useState } from "react"

import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"
import type { LucideIcon } from "lucide-react"

import { BoxIcon, Building2, CircleUserRound, Wrench } from "../icons"
import { neutralAlpha } from "../theme/colors"

export type RecordNamePlaceholder = "item" | "company" | "user" | "tool"

export interface RecordNameProps {
  name: string
  image?: string
  /** The icon shown when there is no image, or the image fails to load. Defaults to "item". */
  placeholder?: RecordNamePlaceholder
  status?: ReactNode
  meta?: ReactNode
}

const placeholderIcons: Record<RecordNamePlaceholder, LucideIcon> = {
  item: BoxIcon,
  company: Building2,
  user: CircleUserRound,
  tool: Wrench,
}

export const RecordName = ({ name, image, placeholder = "item", status, meta }: RecordNameProps) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === "dark"
  const [failedImage, setFailedImage] = useState<string>()
  const Icon = placeholderIcons[placeholder]
  const size = meta ? 36 : 20
  const frame = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: "6px",
    border: `1px solid ${isDark ? neutralAlpha.lighten[100] : neutralAlpha.darken[100]}`,
  }
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
            backgroundColor: theme.palette.background.paper,
            color: "text.secondary",
          }}
        >
          <Icon size={meta ? 16 : 12} />
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <Typography
            variant={meta ? "h6" : "body1"}
            color="text.primary"
            noWrap
            sx={{ minWidth: 0 }}
          >
            {name}
          </Typography>
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
              sx={{ alignItems: "center", gap: "16px", "& svg": { marginRight: "4px" } }}
            >
              {meta}
            </Stack>
          </Typography>
        )}
      </Box>
    </Box>
  )
}
