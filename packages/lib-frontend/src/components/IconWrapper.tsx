import React from "react"

import Box from "@mui/material/Box"
import { type Theme, SxProps } from "@mui/material/styles"

import { LUCIDE_STROKE_WIDTH } from "./lucide"

export interface IconWrapperProps {
  /** Icon to display */
  children: React.ReactElement
  color?: string | ((theme: Theme) => string) | undefined
  /** Size in pixels, sets width and height */
  size?: number
  sx?: SxProps<Theme>
  testId?: string
  /**
   * Decorative by default. Set false only when the icon itself is the
   * accessible name (the parent control has no text or aria-label).
   */
  ariaHidden?: boolean
}

type IconElementProps = {
  color?: string
  height?: number
  width?: number
  strokeWidth?: number
}

/**
 * Sizes and colors an icon. Lucide icons get web's stroke width (1.25)
 * unless the icon already sets `strokeWidth`.
 *
 * @example <IconWrapper color={(theme) => theme.palette.primary.main} size={16}><HomeIcon /></IconWrapper>
 */
export function IconWrapper({
  children,
  size = 16,
  color,
  testId,
  sx,
  ariaHidden = true,
}: IconWrapperProps) {
  return (
    <Box
      aria-hidden={ariaHidden}
      sx={{
        color: (theme) => {
          if (typeof color === "string") return color
          if (typeof color === "function") return color(theme)
          return theme.palette.mode === "dark"
            ? theme.palette.grey[100]
            : theme.palette.grey[900]
        },
        alignItems: "center",
        display: "flex",
        ...sx,
      }}
      data-testid={testId}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<IconElementProps>(child)) return child
        return React.cloneElement(child, {
          color: "currentColor",
          height: size,
          width: size,
          strokeWidth: child.props.strokeWidth ?? LUCIDE_STROKE_WIDTH,
        })
      })}
    </Box>
  )
}
