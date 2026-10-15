import React from "react"

import Chip, { ChipProps } from "@mui/material/Chip"

import { type AccentColorName } from "../theme/accent-colors"

export type PillTone = "default" | "success" | "warning" | "error" | "info"
export type PillColor = PillTone | AccentColorName

// Only the obvious lifecycle words. Anything else needs an explicit `color`.
// Keys are normalised: lowercase, with spaces and hyphens turned into underscores.
const statusTones: Readonly<Record<string, PillTone>> = {
  draft: "default",
  not_started: "default",
  archived: "default",
  active: "info",
  pending: "warning",
  in_progress: "warning",
  blocked: "error",
  failed: "error",
  complete: "success",
  completed: "success",
  done: "success",
}

const normaliseStatus = (status: string): string =>
  status.trim().toLowerCase().replace(/[\s-]+/g, "_")

const sentenceCase = (status: string): string => {
  const text = status.replace(/[_-]+/g, " ").trim().toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export interface PillProps extends Omit<ChipProps, "color" | "variant"> {
  /** A status word such as "in progress". Its tone comes from the shared status list. */
  status?: string
  /** A tone or palette colour. Wins over `status` when both are set. */
  color?: PillColor
}

/**
 * A small pill for a status or a category. Pass `status` for the shared tone of a
 * well-known word, or `color` to pick any tone or palette colour directly.
 * The default tone is outlined; every other colour is tinted.
 */
export const Pill = ({ status, color, label, ...chipProps }: PillProps) => {
  const tone: PillColor =
    color ??
    (status ? (statusTones[normaliseStatus(status)] ?? "default") : "default")
  const text = label ?? (status ? sentenceCase(status) : undefined)

  return (
    <Chip
      {...chipProps}
      size="small"
      color={tone}
      variant={tone === "default" ? "outlined" : "filled"}
      label={text}
    />
  )
}
