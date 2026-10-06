import React, { useEffect, useRef, useState } from "react"

import Button from "@mui/material/Button"
import { SxProps, Theme } from "@mui/material/styles"
import { Check, LoaderCircle, TriangleAlert } from "lucide-react"

import { IconWrapper } from "./IconWrapper"

type ButtonState = "idle" | "loading" | "success" | "errored"

interface LoadingButtonProps {
  onClick: () => void
  children?: React.ReactNode
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success"
  disabled?: boolean
  endIcon?: React.ReactNode
  loading?: boolean
  errored?: boolean
  startIcon?: React.ReactNode
  sx?: SxProps<Theme>
  variant?: "contained" | "outlined" | "text"
}

function getDisplayIcon(buttonState: ButtonState, startIcon: React.ReactNode) {
  const testId = `loading-button-icon-${buttonState}`

  switch (buttonState) {
    case "loading":
      return (
        <IconWrapper
          sx={{
            color: "inherit",
            animation: "spin 1s linear infinite",
            "@keyframes spin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
          size={16}
          testId={testId}
        >
          <LoaderCircle />
        </IconWrapper>
      )
    case "success":
      return (
        <IconWrapper sx={{ color: "inherit" }} size={16} testId={testId}>
          <Check />
        </IconWrapper>
      )
    case "errored":
      return (
        <IconWrapper sx={{ color: "inherit" }} size={16} testId={testId}>
          <TriangleAlert />
        </IconWrapper>
      )
    case "idle":
    default:
      if (!React.isValidElement(startIcon)) return startIcon ?? null
      return (
        <IconWrapper sx={{ color: "inherit" }} size={16} testId={testId}>
          {startIcon}
        </IconWrapper>
      )
  }
}

/** Modal main CTA. Internal — not part of the public package surface. */
export default function LoadingButton({
  children,
  color,
  disabled,
  errored,
  endIcon,
  loading = false,
  onClick,
  startIcon,
  sx,
  variant = "contained",
}: LoadingButtonProps) {
  const [showDoneIcon, setShowDoneIcon] = useState(false)
  const prevLoadingRef = useRef(loading)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const wasLoading = prevLoadingRef.current
    const isLoading = loading

    if (wasLoading && !isLoading) {
      successTimerRef.current = setTimeout(() => {
        setShowDoneIcon(true)
      }, 0)

      resetTimerRef.current = setTimeout(() => {
        setShowDoneIcon(false)
      }, 2000)
    }

    prevLoadingRef.current = loading

    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [loading])

  const buttonState: ButtonState = loading
    ? "loading"
    : !showDoneIcon
      ? "idle"
      : errored
        ? "errored"
        : "success"

  return (
    <Button
      color={color}
      disabled={disabled || loading}
      onClick={loading ? undefined : onClick}
      size="small"
      sx={{ gap: 0.5, ...sx }}
      variant={variant}
    >
      {getDisplayIcon(buttonState, startIcon)}
      {children}
      {endIcon}
    </Button>
  )
}
