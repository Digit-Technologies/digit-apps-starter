/*
Global breakpoints from MUI:
xs, extra-small: 0px
sm, small: 600px
md, medium: 900px
lg, large: 1200px
xl, extra-large: 1536px
*/

import { ThemeOptions } from "@mui/material/styles"

import { muiAlert } from "./muiAlert.js"
import { muiAppBar } from "./muiAppBar.js"
import { muiAutocomplete } from "./muiAutocomplete.js"
import { muiBackdrop } from "./muiBackdrop.js"
import { muiButton } from "./muiButton.js"
import { muiCssBaseline } from "./muiCssBaseline.js"
import { muiDialog } from "./muiDialog.js"
import { muiFormControlLabel } from "./muiFormControlLabel.js"
import { muiIconButton } from "./muiIconButton.js"
import { muiListItemButton } from "./muiListItemButton.js"
import { muiMenu } from "./muiMenu.js"
import { muiMenuItem } from "./muiMenuItem.js"
import { muiOutlinedInput } from "./muiOutlinedInput.js"
import { muiRadio } from "./muiRadio.js"
import { muiSelect } from "./muiSelect.js"
import { muiSwitch } from "./muiSwitch.js"
import { muiTabs } from "./muiTabs.js"
import { muiTextField } from "./muiTextField.js"
import { muiToggleButton } from "./muiToggleButton.js"
import { muiToggleButtonGroup } from "./muiToggleButtonGroup.js"
import { muiTooltip } from "./muiTooltip.js"
import { palette } from "./palette.js"
import { typography } from "./typography.js"

export { mobileScaleFactor } from "./mobileScaleFactor.js"

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
    // MuiPickersInputBase / MuiPickersOutlinedInput stay on digit-web (need
    // @mui/x-date-pickers). Do not copy them into the starter.
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
