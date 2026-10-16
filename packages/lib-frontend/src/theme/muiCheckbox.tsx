import React from "react"

import SvgIcon from "@mui/material/SvgIcon"
import { Components, Theme } from "@mui/material/styles"

import { blue, neutral, stone } from "./colors"
import { ThemeProps } from "./types"

// Native checkboxes are 16px squares with a 4px radius. MUI's default glyph is 24px.
const CheckboxBox = ({ darkMode, checked }: ThemeProps & { checked: boolean }) => (
  <SvgIcon viewBox="0 0 16 16" sx={{ width: 16, height: 16, display: "block" }}>
    <rect
      x={checked ? 0 : 0.5}
      y={checked ? 0 : 0.5}
      width={checked ? 16 : 15}
      height={checked ? 16 : 15}
      rx={4}
      fill={checked ? blue[500] : darkMode ? stone[800] : neutral.white}
      stroke={checked ? "none" : darkMode ? stone[600] : stone[300]}
    />
    {checked && (
      <path
        d="M4.5 8.3 7 10.7l4.5-5"
        fill="none"
        stroke={neutral.white}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </SvgIcon>
)

// Checked checkboxes use the same blue as switches and radios.
export const muiCheckbox = ({
  darkMode,
}: ThemeProps): Components<Omit<Theme, "components">>["MuiCheckbox"] => ({
  defaultProps: {
    disableRipple: true,
    icon: <CheckboxBox darkMode={darkMode} checked={false} />,
    checkedIcon: <CheckboxBox darkMode={darkMode} checked />,
  },
  styleOverrides: {
    root: {
      padding: 4,
      borderRadius: 4,
      boxShadow: "none",
      "&.Mui-checked": {
        color: darkMode ? blue[400] : blue[500],
      },
      "&.Mui-checked:hover": {
        backgroundColor: darkMode ? blue[900] : blue[50],
      },
    },
  },
})
