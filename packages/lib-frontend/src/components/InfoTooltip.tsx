import React from "react"

import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip"
import { Theme, styled, SxProps } from "@mui/material/styles"
import { Info } from "lucide-react"

import { IconWrapper } from "./IconWrapper"

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    fontSize: theme.typography.pxToRem(12),
    lineHeight: "1rem",
  },
}))

interface InfoTooltipProps {
  text: string | React.ReactNode
  sx?: SxProps<Theme>
  size?: number
  icon?: React.ReactElement
}

export default function InfoTooltip({
  text,
  sx,
  size = 16,
  icon = <Info />,
}: InfoTooltipProps) {
  return (
    <HtmlTooltip title={text}>
      <span>
        <IconWrapper
          size={size}
          sx={{
            opacity: (theme: Theme) => theme.palette.opacity.helper,
            ...sx,
          }}
        >
          {icon}
        </IconWrapper>
      </span>
    </HtmlTooltip>
  )
}
