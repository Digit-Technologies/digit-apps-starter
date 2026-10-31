import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import { Theme, keyframes } from "@mui/material/styles"

import { Check, CircleAlert, FileText, LoaderCircle, RefreshCw, X } from "../icons.js"
import { outer } from "../theme/shadows.js"

export type FileUploadStatus = "uploading" | "uploaded" | "failed"

export interface FileUploadRowProps {
  /** The file name. Truncates with an ellipsis. */
  name: ReactNode
  /** The file size, already formatted, for example "1.3 MB". */
  size?: ReactNode
  status: FileUploadStatus
  /** Replaces the status text ("Uploading...", "Ready", "Failed"). */
  statusLabel?: ReactNode
  /** The 20px icon in the tile. Defaults to a file icon. */
  icon?: ReactNode
  /** Shows the remove (X) button. */
  onRemove?: () => void
  /** Shows a retry button when the upload failed. */
  onRetry?: () => void
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const defaultLabel: Record<FileUploadStatus, string> = {
  uploading: "Uploading...",
  uploaded: "Ready",
  failed: "Failed",
}

/**
 * One file in an upload list (Figma File upload/Set, Uploading / Uploaded rows): a 36px tile, the
 * name and size, the status, and xs retry and remove buttons. An uploading row dims its tile and
 * text to 30%. Put the rows in a Stack with gap 1 above or below a FileDropZone.
 */
export const FileUploadRow = ({
  name,
  size,
  status,
  statusLabel,
  icon,
  onRemove,
  onRetry,
}: FileUploadRowProps) => {
  const uploading = status === "uploading"
  const failed = status === "failed"
  const dim = uploading ? { opacity: (t: Theme) => t.palette.opacity.disabled } : {}

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "border.default",
        borderRadius: 1,
        boxShadow: outer.sm,
        minWidth: 0,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: (t) => t.spacing(4.5),
          height: (t) => t.spacing(4.5),
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          bgcolor: "background.paper",
          border: 1,
          borderColor: "border.strong",
          borderRadius: 0.75,
          color: "text.secondary",
          ...dim,
        }}
      >
        {icon ?? <FileText size={20} />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5, ...dim }}>
        <Typography variant="body2" color="text.primary" noWrap>
          {name}
        </Typography>
        {size && (
          <Typography variant="overline" color="text.tertiary" noWrap>
            {size}
          </Typography>
        )}
      </Box>
      <Box
        role="status"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexShrink: 0,
          color: failed ? "error.main" : "text.primary",
          "& svg": { width: (t) => t.spacing(2), height: (t) => t.spacing(2) },
        }}
      >
        {uploading && (
          <Box component="span" sx={{ display: "inline-flex", animation: `${spin} 1s linear infinite` }}>
            <LoaderCircle size={16} />
          </Box>
        )}
        {status === "uploaded" && <Check size={16} />}
        {failed && <CircleAlert size={16} />}
        <Typography variant="body1" color="inherit" noWrap>
          {statusLabel ?? defaultLabel[status]}
        </Typography>
      </Box>
      {failed && onRetry && (
        <IconButton aria-label="Retry upload" size="xs" onClick={onRetry} sx={{ flexShrink: 0 }}>
          <RefreshCw size={16} />
        </IconButton>
      )}
      {onRemove && (
        <IconButton aria-label="Remove file" size="xs" onClick={onRemove} sx={{ flexShrink: 0 }}>
          <X size={16} />
        </IconButton>
      )}
    </Box>
  )
}
