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
import { muiListItemIcon } from "./muiListItemIcon.js"
import { muiListItemText } from "./muiListItemText.js"
import { muiListSubheader } from "./muiListSubheader.js"
import { muiPopover } from "./muiPopover.js"
import { muiAlertTitle } from "./muiAlertTitle.js"
import { muiAvatarGroup } from "./muiAvatarGroup.js"
import { muiSvgIcon } from "./muiSvgIcon.js"
import { muiAvatar } from "./muiAvatar.js"
import { muiBadge } from "./muiBadge.js"
import { muiSkeleton } from "./muiSkeleton.js"
import { muiSnackbar, muiSnackbarContent } from "./muiSnackbar.js"
import { outer } from "./shadows.js"
import { muiAppBar } from "./muiAppBar.js"
import { muiAutocomplete } from "./muiAutocomplete.js"
import { muiBackdrop } from "./muiBackdrop.js"
import { muiButton } from "./muiButton.js"
import { muiCard } from "./muiCard.js"
import { muiCheckbox } from "./muiCheckbox.js"
import { muiChip } from "./muiChip.js"
import { muiCssBaseline } from "./muiCssBaseline.js"
import { muiDialog } from "./muiDialog.js"
import { muiDataGrid } from "./muiDataGrid.js"
import { muiDivider } from "./muiDivider.js"
import { muiLinearProgress } from "./muiLinearProgress.js"
import { muiDialogActions, muiDialogContent, muiDialogTitle } from "./muiDialogParts.js"
import { muiFilledInput } from "./muiFilledInput.js"
import { muiFormControlLabel } from "./muiFormControlLabel.js"
import { muiIconButton } from "./muiIconButton.js"
import { muiInput } from "./muiInput.js"
import { muiInputAdornment } from "./muiInputAdornment.js"
import { muiListItemButton } from "./muiListItemButton.js"
import { muiMenu } from "./muiMenu.js"
import { muiMenuItem } from "./muiMenuItem.js"
import { muiOutlinedInput } from "./muiOutlinedInput.js"
import { muiPaper } from "./muiPaper.js"
import { muiRadio } from "./muiRadio.js"
import { muiSelect } from "./muiSelect.js"
import { muiSwitch } from "./muiSwitch.js"
import { muiTab, muiTabs } from "./muiTabs.js"
import { muiTableCell } from "./muiTableCell.js"
import { muiTableRow } from "./muiTableRow.js"
import { muiTextField } from "./muiTextField.js"
import { muiToggleButton } from "./muiToggleButton.js"
import { muiToggleButtonGroup } from "./muiToggleButtonGroup.js"
import { muiTooltip } from "./muiTooltip.js"
import { muiTypography } from "./muiTypography.js"
import { palette } from "./palette.js"
import { typography } from "./typography.js"

export const themeOptions = (darkMode: boolean): ThemeOptions => ({
  components: {
    MuiAlert: muiAlert(),
    MuiAlertTitle: muiAlertTitle(),
    MuiAvatarGroup: muiAvatarGroup(),
    MuiListItemIcon: muiListItemIcon(),
    MuiListItemText: muiListItemText(),
    MuiListSubheader: muiListSubheader(),
    MuiPopover: muiPopover(),
    MuiSnackbar: muiSnackbar(),
    MuiSvgIcon: muiSvgIcon(),
    MuiAppBar: muiAppBar(),
    MuiAutocomplete: muiAutocomplete(),
    MuiAvatar: muiAvatar(),
    MuiBadge: muiBadge(),
    MuiSkeleton: muiSkeleton(),
    MuiSnackbarContent: muiSnackbarContent(),
    MuiCssBaseline: muiCssBaseline(),
    MuiBackdrop: muiBackdrop(),
    MuiCard: muiCard(),
    MuiCheckbox: muiCheckbox(),
    MuiChip: muiChip(),
    MuiButton: muiButton(),
    MuiDialog: muiDialog(),
    MuiDialogTitle: muiDialogTitle(),
    MuiDialogContent: muiDialogContent(),
    MuiDialogActions: muiDialogActions(),
    MuiFilledInput: muiFilledInput(),
    MuiFormControlLabel: muiFormControlLabel(),
    MuiIconButton: muiIconButton(),
    MuiInput: muiInput(),
    MuiInputAdornment: muiInputAdornment(),
    MuiInputBase: {
      defaultProps: {
        disableInjectingGlobalStyles: true,
      },
    },
    MuiListItemButton: muiListItemButton(),
    MuiMenuItem: muiMenuItem(),
    MuiMenu: muiMenu(),
    MuiOutlinedInput: muiOutlinedInput(),
    MuiPaper: muiPaper(),
    // MuiPickersInputBase / MuiPickersOutlinedInput stay on digit-web (need
    // @mui/x-date-pickers). Do not copy them into the starter.
    MuiRadio: muiRadio(),
    MuiSelect: muiSelect(),
    MuiSwitch: muiSwitch(),
    MuiTab: muiTab(),
    MuiTabs: muiTabs(),
    MuiDataGrid: muiDataGrid(),
    MuiDivider: muiDivider(),
    MuiLinearProgress: muiLinearProgress(),
    MuiTableCell: muiTableCell(),
    MuiTableRow: muiTableRow(),
    MuiTextField: muiTextField(),
    MuiToggleButtonGroup: muiToggleButtonGroup(),
    MuiToggleButton: muiToggleButton(),
    MuiTooltip: muiTooltip(),
    MuiTypography: muiTypography(),
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
