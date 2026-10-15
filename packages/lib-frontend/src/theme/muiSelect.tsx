import React from "react"

import { Components, Theme } from "@mui/material/styles"

import { ChevronDown } from "../icons"

// Native selects read as text with a chevron. MUI's default triangle is replaced here.
const SelectChevron = ({ className }: { className?: string }) => (
  <ChevronDown size={16} className={className} />
)

export const muiSelect = (): Components<
  Omit<Theme, "components">
>["MuiSelect"] => {
  return {
    defaultProps: {
      IconComponent: SelectChevron,
    },
    styleOverrides: {
      select: ({ theme }) => ({
        fontSize: theme.typography.body1.fontSize,
        lineHeight: theme.typography.body1.lineHeight,
      }),
    },
  }
}
