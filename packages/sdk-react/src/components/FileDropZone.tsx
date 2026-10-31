import React, { useRef, useState } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useTheme } from "@mui/material/styles"

import { Upload } from "../icons.js"
import { focusColor } from "../theme/focus.js"
import { fieldColors } from "../theme/inputHoverFill.js"

export interface FileDropZoneProps {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  label?: string
  disabled?: boolean
}

// Mirrors the browser's own `accept` matching, so a dropped file passes the same filter as a picked
// one. Entries are extensions (".csv"), exact types ("text/csv"), or wildcards ("image/*").
const matchesAccept = (file: File, accept: string | undefined): boolean => {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => {
      if (entry.startsWith(".")) return name.endsWith(entry)
      if (entry.endsWith("/*")) return type.startsWith(entry.slice(0, -1))
      return type === entry
    })
}

/**
 * A drop area that takes dragged files, or opens the file picker when clicked. Dropped files are
 * checked against `accept` the same way the picker checks them, and files that do not match are
 * left out.
 */
export const FileDropZone = ({
  accept,
  multiple,
  onFiles,
  label = "Drag & drop or browse files",
  disabled,
}: FileDropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const theme = useTheme()
  // Figma File upload/Set "Blank": the form field fill (a.05 / w.15), and its hover fill while a
  // file is dragged over.
  const { fill: restFill, hoverFill: dragFill } = fieldColors(theme)

  const emit = (files: File[]) => {
    const accepted = files.filter((file) => matchesAccept(file, accept))
    const picked = multiple ? accepted : accepted.slice(0, 1)
    if (picked.length > 0) onFiles(picked)
  }

  return (
    <>
      <Box
        component="button"
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault()
          setIsDragging(false)
          if (!disabled) emit(Array.from(e.dataTransfer.files))
        }}
        sx={{
          display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center",
          width: "100%", gap: 1, px: 2, py: 2.5, border: 0, borderRadius: "8px",
          font: "inherit", color: "text.secondary",
          bgcolor: isDragging ? dragFill : restFill,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? theme.palette.opacity.disabled : 1,
          "&:hover:not(:disabled)": { bgcolor: dragFill },
          "&:focus-visible": { outline: "none", boxShadow: `0 0 0 1px ${focusColor(theme)} inset` },
        }}
      >
        <Upload size={12} aria-hidden="true" style={{ pointerEvents: "none" }} />
        <Typography variant="overline" color="text.secondary" sx={{ pointerEvents: "none" }}>
          {label}
        </Typography>
      </Box>
      {/* Outside the button so its click does not re-trigger the picker. */}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={(e) => {
          emit(Array.from(e.target.files ?? []))
          e.target.value = ""
        }}
      />
    </>
  )
}
