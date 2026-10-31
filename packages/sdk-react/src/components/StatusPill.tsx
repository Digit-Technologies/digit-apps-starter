import React, { ReactNode } from "react"

import Chip, { ChipProps } from "@mui/material/Chip"

/**
 * The six record-status stages of the Figma pill guide (Atoms › Pill, "Record status"). Every
 * record type maps its own status words onto one of them, so the same stage always has the same
 * colour across the platform.
 */
export type RecordStatus = "preliminary" | "open" | "active" | "stopped" | "done" | "closed"

const stageChip: Record<RecordStatus, Pick<ChipProps, "color" | "variant">> = {
  // A starting point or draft, such as "Draft".
  preliminary: { variant: "outlined" },
  // Open or ready for work, such as "Sent", "Not started" or "Active".
  open: { color: "blue" },
  // Actively being worked on, such as "In progress", "Partially fulfilled" or "Pending".
  active: { color: "yellow" },
  // Action needed to restart, such as "Stopped", "Rejected" or "Overdue".
  stopped: { color: "red" },
  // Positive final state, such as "Complete", "Approved" or "Paid".
  done: { color: "green" },
  // Neutral final state, such as "Closed", "Cancelled" or "Archived".
  closed: {},
}

export interface StatusPillProps extends Omit<ChipProps, "color" | "variant" | "label"> {
  /** The stage the record's status belongs to. It picks the colour. */
  status: RecordStatus
  /** The record's own status word, such as "Partially fulfilled". */
  label: ReactNode
}

/**
 * A record's status as a Figma pill. Pick the `status` stage that matches the meaning of the
 * status, and pass the status word as `label`. For a category or a count that is not a status,
 * use the themed MUI `Chip` directly (`<Chip size="small" color="sky" label="Category" />`).
 */
export const StatusPill = ({ status, label, ...chipProps }: StatusPillProps) => (
  <Chip {...chipProps} {...stageChip[status]} label={label} />
)
