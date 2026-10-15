import React from "react"

import Chip, { ChipProps } from "@mui/material/Chip"

export type StatusTone = "default" | "success" | "warning" | "error" | "info"

// Lifecycle words that show up across Digit apps. Keys are normalised: lowercase, with spaces
// and hyphens turned into underscores. Anything not listed renders as the neutral default tone.
export const statusTones: Readonly<Record<string, StatusTone>> = {
  // Done or live
  done: "success",
  complete: "success",
  completed: "success",
  live: "success",
  published: "success",
  approved: "success",
  paid: "success",
  passed: "success",
  received: "success",
  // In motion
  active: "info",
  building: "info",
  open: "info",
  scheduled: "info",
  custom: "info",
  // Waiting on someone or something
  pending: "warning",
  in_progress: "warning",
  awaiting: "warning",
  invited: "warning",
  // Stopped
  blocked: "error",
  failed: "error",
  error: "error",
  rejected: "error",
  overdue: "error",
  expired: "error",
  // Neutral: not yet started, or set aside
  default: "default",
  draft: "default",
  not_started: "default",
  archived: "default",
  inactive: "default",
  cancelled: "default",
}

const normaliseStatus = (status: string): string =>
  status.trim().toLowerCase().replace(/[\s-]+/g, "_")

export const resolveStatusTone = (status: string | undefined): StatusTone =>
  (status && statusTones[normaliseStatus(status)]) || "default"

const sentenceCase = (status: string): string => {
  const text = status.replace(/[_-]+/g, " ").trim().toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export interface StatusChipProps
  extends Omit<ChipProps, "color" | "variant"> {
  /** A lifecycle word such as "in progress". Its tone comes from `statusTones`. */
  status?: string
  /** An explicit tone. Wins over `status` when both are set. */
  color?: StatusTone
}

/**
 * A small pill for a state or a category. Pass `status` to get the shared tone for that word,
 * or `color` to pick a tone directly. The default tone is outlined; the others are tinted.
 */
export const StatusChip = ({
  status,
  color,
  label,
  ...chipProps
}: StatusChipProps) => {
  const tone = color ?? resolveStatusTone(status)
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
