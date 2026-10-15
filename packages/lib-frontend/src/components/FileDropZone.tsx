import React, { useRef, useState } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

import { Upload } from "../icons"
import { neutralAlpha } from "../theme/colors"

export interface FileDropZoneProps {
  accept?: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  label?: string
  disabled?: boolean
}

/** A drop area that takes dragged files, or opens the file picker when clicked. */
export const FileDropZone = ({
  accept,
  multiple,
  onFiles,
  label = "Drag & drop or browse files",
  disabled,
}: FileDropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const emit = (files: File[]) => {
    const picked = multiple ? files : files.slice(0, 1)
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
          width: "100%", gap: "8px", px: "16px", py: "20px", border: 0, borderRadius: "8px",
          font: "inherit", color: "text.secondary",
          bgcolor: isDragging ? neutralAlpha.darken[100] : neutralAlpha.darken[50],
          cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
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
