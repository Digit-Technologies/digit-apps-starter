import React from "react"

import { Components, Theme } from "@mui/material/styles"

import { ChevronDown } from "../icons"

// Native selects read as text with a chevron. MUI's default triangle is replaced here.
const SelectChevron = ({ className }: { className?: string }) => (
  <ChevronDown size={16} className={className} />
)

// Figma Select (spec 2.14): the value, then the field gap, then a 16px chevron at 60%
// (all/opacity/helper) on the field's trailing padding. The field root sets the padding and gap as
// CSS variables, so this works for every variant and size.
export const muiSelect = (): Components<Omit<Theme, "components">>["MuiSelect"] => ({
  defaultProps: {
    IconComponent: SelectChevron,
  },
  styleOverrides: {
    select: ({ theme }) => ({
      ...theme.typography.body1,
      minHeight: 0,
      "&&&": {
        paddingRight: `calc(var(--digit-field-gap, ${theme.spacing(0.5)}) + ${theme.spacing(2)})`,
      },
    }),
    icon: ({ theme }) => ({
      width: theme.spacing(2),
      height: theme.spacing(2),
      top: `calc(50% - ${theme.spacing(1)})`,
      right: `var(--digit-field-px, ${theme.spacing(1)})`,
      color: theme.palette.text.primary,
      opacity: theme.palette.opacity.helper,
      // A disabled field fades its content to 30%, so the chevron keeps its colour.
      "&.Mui-disabled": { color: theme.palette.text.primary },
    }),
  },
})
