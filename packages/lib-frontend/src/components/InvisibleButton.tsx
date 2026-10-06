import * as React from "react"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import { SxProps, Theme, useTheme } from "@mui/material/styles"

import { blue } from "../theme/colors"

export interface InvisibleButtonProps {
  children: React.ReactNode
  enabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  sx?: SxProps<Theme>
  /** Accepted for API parity with digit-web. The web component does not apply it. */
  noColor?: boolean
  startIcon?: React.ReactElement
  endIcon?: React.ReactElement
  ariaLabel?: string
  iconSx?: SxProps<Theme>
}

/**
 * Button with minimal styling — nested text looks like a link.
 * Preferred over a random clickable element because it is accessible.
 */
export function InvisibleButton({
  children,
  enabled = true,
  onClick,
  sx = {},
  startIcon,
  endIcon,
  ariaLabel,
  iconSx,
}: InvisibleButtonProps) {
  const theme = useTheme()

  return (
    <ButtonBase
      aria-label={ariaLabel}
      disabled={!enabled}
      disableRipple={!enabled}
      focusRipple={false}
      sx={{
        alignItems: "center",
        cursor: enabled ? "pointer" : "default",
        display: "flex",
        fontFamily: theme.typography.fontFamily,
        justifyContent: "flex-start",
        minWidth: 0,
        width: "fit-content",
        userSelect: "text",
        ...sx,
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.mode === "dark" ? blue[400] : blue[600]}`,
          outlineOffset: "2px",
        },
      }}
      onClick={enabled ? onClick : undefined}
    >
      {startIcon && (
        <Box
          component="span"
          sx={{ marginRight: 1, flexShrink: 0, ...iconSx }}
          data-testid="start-icon"
        >
          {startIcon}
        </Box>
      )}
      <div
        style={{
          overflow: "visible",
          minWidth: 0,
          position: "relative",
        }}
      >
        <Box
          className="invisible-button-text"
          sx={{
            display: "flex",
            alignItems: "center",
            maxWidth: "100%",
            minWidth: 0,
            overflow: "visible",
            ...(enabled ? theme.typography.body1Link : theme.typography.body1),
          }}
        >
          {React.Children.toArray(children).map((child, index) => {
            const isLastChild = index === React.Children.count(children) - 1
            const childKey =
              React.isValidElement(child) && child.key
                ? child.key
                : `child-${index}`

            if (React.isValidElement(child)) {
              return (
                <div key={childKey} style={{ flexShrink: 0 }}>
                  {child}
                </div>
              )
            }

            if (
              isLastChild ||
              typeof child === "string" ||
              typeof child === "number"
            ) {
              return (
                <div
                  key={childKey}
                  style={{
                    display: "block",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Box
                    className="invisible-button-text"
                    sx={{
                      ...(enabled
                        ? theme.typography.body1Link
                        : theme.typography.body1),
                      display: "inline",
                    }}
                  >
                    {child}
                  </Box>
                </div>
              )
            }

            return child
          })}
        </Box>
      </div>
      {endIcon && (
        <Box component="span" sx={{ marginLeft: 1, flexShrink: 0, ...iconSx }}>
          {endIcon}
        </Box>
      )}
    </ButtonBase>
  )
}
