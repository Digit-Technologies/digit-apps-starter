/*
Global breakpoints from MUI:
xs, extra-small: 0px
sm, small: 600px
md, medium: 900px
lg, large: 1200px
xl, extra-large: 1536px
*/

import { ThemeOptions } from "@mui/material/styles"

import { muiAlert } from "./muiAlert"
import { muiAppBar } from "./muiAppBar"
import { muiAutocomplete } from "./muiAutocomplete"
import { muiBackdrop } from "./muiBackdrop"
import { muiButton } from "./muiButton"
import { muiCssBaseline } from "./muiCssBaseline"
import { muiDialog } from "./muiDialog"
import { muiFormControlLabel } from "./muiFormControlLabel"
import { muiIconButton } from "./muiIconButton"
import { muiListItemButton } from "./muiListItemButton"
import { muiMenu } from "./muiMenu"
import { muiMenuItem } from "./muiMenuItem"
import { muiOutlinedInput } from "./muiOutlinedInput"
import { muiRadio } from "./muiRadio"
import { muiSelect } from "./muiSelect"
import { muiSwitch } from "./muiSwitch"
import { muiTabs } from "./muiTabs"
import { muiTextField } from "./muiTextField"
import { muiToggleButton } from "./muiToggleButton"
import { muiToggleButtonGroup } from "./muiToggleButtonGroup"
import { muiTooltip } from "./muiTooltip"
import { palette } from "./palette"
import { typography } from "./typography"

export { mobileScaleFactor } from "./mobileScaleFactor"

export const themeOptions = (darkMode: boolean): ThemeOptions => ({
  components: {
    MuiAlert: muiAlert({ darkMode }),
    MuiAppBar: muiAppBar({ darkMode }),
    MuiAutocomplete: muiAutocomplete(),
    MuiCssBaseline: muiCssBaseline({ darkMode }),
    MuiBackdrop: muiBackdrop(),
    MuiButton: muiButton(),
    MuiDialog: muiDialog(),
    MuiFormControlLabel: muiFormControlLabel(),
    MuiIconButton: muiIconButton({ darkMode }),
    MuiInputBase: {
      defaultProps: {
        disableInjectingGlobalStyles: true,
      },
    },
    MuiListItemButton: muiListItemButton({ darkMode }),
    MuiMenuItem: muiMenuItem(),
    MuiMenu: muiMenu(),
    MuiOutlinedInput: muiOutlinedInput(),
    MuiRadio: muiRadio(darkMode),
    MuiSelect: muiSelect(),
    MuiSwitch: muiSwitch(),
    MuiTabs: muiTabs(),
    MuiTextField: muiTextField(),
    MuiToggleButtonGroup: muiToggleButtonGroup(),
    MuiToggleButton: muiToggleButton(),
    MuiTooltip: muiTooltip(),
  },
  palette: palette({ darkMode }),
  shape: {
    borderRadius: 16,
  },
  spacing: 8, // default spacing multiplier for md and above
  spacingMultiplier: {
    xs: 10, // mobile uses 10px base
    md: 8, // desktop uses 8px base (MUI default)
  },
  typography: typography({ darkMode }),
})
