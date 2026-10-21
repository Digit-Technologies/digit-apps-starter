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
import { muiAvatar } from "./muiAvatar"
import { muiBadge } from "./muiBadge"
import { muiSkeleton } from "./muiSkeleton"
import { muiSnackbarContent } from "./muiSnackbar"
import { outer } from "./shadows"
import { muiAppBar } from "./muiAppBar"
import { muiAutocomplete } from "./muiAutocomplete"
import { muiBackdrop } from "./muiBackdrop"
import { muiButton } from "./muiButton"
import { muiCard } from "./muiCard"
import { muiCheckbox } from "./muiCheckbox"
import { muiChip } from "./muiChip"
import { muiCssBaseline } from "./muiCssBaseline"
import { muiDialog } from "./muiDialog"
import { muiDataGrid } from "./muiDataGrid"
import { muiDivider } from "./muiDivider"
import { muiLinearProgress } from "./muiLinearProgress"
import { muiDialogActions, muiDialogContent, muiDialogTitle } from "./muiDialogParts"
import { muiFilledInput } from "./muiFilledInput"
import { muiFormControlLabel } from "./muiFormControlLabel"
import { muiIconButton } from "./muiIconButton"
import { muiListItemButton } from "./muiListItemButton"
import { muiMenu } from "./muiMenu"
import { muiMenuItem } from "./muiMenuItem"
import { muiOutlinedInput } from "./muiOutlinedInput"
import { muiPaper } from "./muiPaper"
import { muiRadio } from "./muiRadio"
import { muiSelect } from "./muiSelect"
import { muiSwitch } from "./muiSwitch"
import { muiTab, muiTabs } from "./muiTabs"
import { muiTableCell } from "./muiTableCell"
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
    MuiAvatar: muiAvatar(),
    MuiBadge: muiBadge(),
    MuiSkeleton: muiSkeleton(),
    MuiSnackbarContent: muiSnackbarContent(),
    MuiCssBaseline: muiCssBaseline({ darkMode }),
    MuiBackdrop: muiBackdrop(),
    MuiCard: muiCard(),
    MuiCheckbox: muiCheckbox({ darkMode }),
    MuiChip: muiChip(),
    MuiButton: muiButton(),
    MuiDialog: muiDialog(),
    MuiDialogTitle: muiDialogTitle(),
    MuiDialogContent: muiDialogContent(),
    MuiDialogActions: muiDialogActions(),
    MuiFilledInput: muiFilledInput(),
    MuiFormControlLabel: muiFormControlLabel(),
    MuiIconButton: muiIconButton({ darkMode }),
    MuiInput: {
      defaultProps: {
        disableUnderline: true,
      },
    },
    MuiInputBase: {
      defaultProps: {
        disableInjectingGlobalStyles: true,
      },
    },
    MuiListItemButton: muiListItemButton({ darkMode }),
    MuiMenuItem: muiMenuItem(),
    MuiMenu: muiMenu(),
    MuiOutlinedInput: muiOutlinedInput(),
    MuiPaper: muiPaper(),
    // MuiPickersInputBase / MuiPickersOutlinedInput stay on digit-web (need
    // @mui/x-date-pickers). Do not copy them into the starter.
    MuiRadio: muiRadio(darkMode),
    MuiSelect: muiSelect(),
    MuiSwitch: muiSwitch(),
    MuiTab: muiTab(),
    MuiTabs: muiTabs(),
    MuiDataGrid: muiDataGrid(),
    MuiDivider: muiDivider(),
    MuiLinearProgress: muiLinearProgress(),
    MuiTableCell: muiTableCell(),
    MuiTextField: muiTextField(),
    MuiToggleButtonGroup: muiToggleButtonGroup(),
    MuiToggleButton: muiToggleButton(),
    MuiTooltip: muiTooltip(),
  },
  palette: palette({ darkMode }),
  // MUI's material elevations (Dialog 24, Popover 8, contained Button 2 and 4) are replaced with
  // the native outer scale. Each of the 25 levels maps to one of the scale's steps.
  shadows: [
    "none",
    outer.sm,
    outer.sm,
    outer.md,
    outer.md,
    outer.md,
    outer.md,
    outer.md,
    outer.md,
    outer.lg,
    outer.lg,
    outer.lg,
    outer.lg,
    outer.lg,
    outer.lg,
    outer.lg,
    outer.lg,
    outer.xl,
    outer.xl,
    outer.xl,
    outer.xl,
    outer.xl,
    outer.xl,
    outer.xl,
    outer.xl,
  ] as ThemeOptions["shadows"],
  shape: {
    borderRadius: 16,
  },
  // Figma Scale: the spacing base is 8px, and 10px below 600px. muiCssBaseline sets the variable,
  // so every theme.spacing() value, and every sx padding or gap, scales with it.
  spacing: (factor: number) => `calc(var(--digit-spacing-base, 8px) * ${factor})`,
  // Figma Animation: every transition is 20ms ease-in.
  transitions: {
    duration: {
      shortest: 20,
      shorter: 20,
      short: 20,
      standard: 20,
      complex: 20,
      enteringScreen: 20,
      leavingScreen: 20,
    },
    easing: {
      easeInOut: "ease-in",
      easeOut: "ease-in",
      easeIn: "ease-in",
      sharp: "ease-in",
    },
  },
  typography: typography({ darkMode }),
})
