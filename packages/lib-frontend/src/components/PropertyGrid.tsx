import React, { ReactNode } from "react"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"

import { fieldColors } from "../theme/inputHoverFill"

export interface PropertyGridRow {
  label: ReactNode
  /** Text, or a control: an invisible `Select variant="standard"` or a borderless `TextField`. */
  value: ReactNode
}

export interface PropertyGridProps {
  rows: PropertyGridRow[]
  /** Width of the label column in px, before its 8px padding. */
  labelWidth?: number
}

/**
 * A bordered block of label and value rows, such as entity custom fields (Figma settings
 * General 25394:7867, Locations 25395:25435). 36px rows split by solid lines, a 128px label
 * cell with a faint right border, and a value cell that holds text or an inset input.
 */
export const PropertyGrid = ({ rows, labelWidth = 128 }: PropertyGridProps) => (
  <Box
    className="PropertyGrid-root"
    sx={(theme) => ({
      border: `1px solid ${theme.palette.border.solidStrong}`,
      borderRadius: "8px",
      overflow: "hidden",
      backgroundColor: theme.palette.background.paper,
    })}
  >
    {rows.map((row, index) => (
      <Box
        key={index}
        sx={(theme) => ({
          display: "flex",
          alignItems: "stretch",
          minHeight: 36,
          "&:not(:last-of-type)": { borderBottom: `1px solid ${theme.palette.border.solidStrong}` },
        })}
      >
        <Box
          sx={(theme) => ({
            flex: `0 0 ${labelWidth}px`,
            boxSizing: "content-box",
            display: "flex",
            alignItems: "center",
            px: 1,
            borderRight: `1px solid ${theme.palette.border.default}`,
            minWidth: 0,
          })}
        >
          <Typography variant="body1" color="text.primary" noWrap component="span">
            {row.label}
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            px: 1,
            // Figma Inset input: the control fills the cell edge to edge (radius 0, transparent,
            // a.05 / w.10 on hover) and its text keeps the cell's 8px inset.
            "& > .MuiFormControl-root, & > .MuiInputBase-root": {
              flex: 1,
              alignSelf: "stretch",
              mx: -1,
              minWidth: 0,
            },
            "& .MuiInputBase-root": {
              height: "100%",
              minHeight: 36,
              borderRadius: 0,
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: fieldColors(theme).invisibleHoverFill,
              },
              "&::before, &::after": { display: "none" },
            },
            // The themed field root already pads its text 8px, which is the cell's inset.
            "& .MuiSelect-icon": { right: theme.spacing(1), opacity: theme.palette.opacity.helper },
            "& .MuiSelect-select.MuiSelect-select": { paddingRight: theme.spacing(4) },
          })}
        >
          {typeof row.value === "string" || typeof row.value === "number" ? (
            <Typography variant="body1" color="text.primary" noWrap component="span">
              {row.value}
            </Typography>
          ) : (
            row.value
          )}
        </Box>
      </Box>
    ))}
  </Box>
)
