import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"
import type { LucideIcon } from "lucide-react"

import { Box as BoxIcon, Building2, CircleUserRound, Wrench } from "../icons"
import { neutral, neutralAlpha, stone } from "../theme/colors"

export type RecordNamePlaceholder = "item" | "company" | "user" | "tool"

export interface RecordNameProps {
  name: string
  image?: string
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

export const RecordName = ({
  name,
  image,
  placeholder = "item",
  status,
  meta,
}: RecordNameProps) => {
  const theme = useTheme()
  const Icon = placeholderIcons[placeholder]
  const frame = {
    width: 24,
    height: 24,
    flexShrink: 0,
    borderRadius: "4px",
    border: `1px solid ${neutralAlpha.darken[100]}`,
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
      {image ? (
        <Box component="img" src={image} alt="" sx={{ ...frame, objectFit: "cover" }} />
      ) : (
        <Box
          sx={{
            ...frame,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.mode === "dark" ? stone[800] : neutral[50],
            color: "text.secondary",
          }}
        >
          <Icon size={16} />
        </Box>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <Typography variant="h6" color="text.primary" noWrap sx={{ minWidth: 0 }}>
            {name}
          </Typography>
          {status}
        </Box>
        {meta && (
          <Typography variant="body1" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing="8px" sx={{ alignItems: "center" }}>
              {meta}
            </Stack>
          </Typography>
        )}
      </Box>
    </Box>
  )
}
