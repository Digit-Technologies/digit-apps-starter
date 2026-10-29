import { createElement } from "react"

import { Components, Theme } from "@mui/material/styles"

import { ChevronDown, X } from "../icons.js"

import { menuListStyles, menuPaperStyles } from "./muiMenu.js"
import { menuItemStyles } from "./muiMenuItem.js"

// Figma Menu "as combobox" (13059:44026): the popup is the menu paper with 28px menu items.
export const muiAutocomplete = (): Components<
  Omit<Theme, "components">
>["MuiAutocomplete"] => {
  return {
    defaultProps: {
      // Figma select trail icons: a 16px chevron (and clear X) instead of MUI's filled triangle.
      popupIcon: createElement(ChevronDown, { size: 16 }),
      clearIcon: createElement(X, { size: 16 }),
      // A 4px gap between the field and the popup, like a menu.
      slotProps: {
        popper: {
          modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
        },
      },
    },
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: theme.typography.body1.fontSize,
        "& ::placeholder": {
          fontSize: theme.typography.body1.fontSize,
        },
        // MUI pads the field for its floating label and 48px touch targets (filled paddingTop
        // 19, outlined padding 9, input 7px 4px). The themed field already has the Figma height
        // and side padding, so only the room for the trailing icons is kept. Doubled class to
        // outrank MUI's own "& .MuiFilledInput-root.MuiInputBase-sizeSmall" rules.
        "&& .MuiInputBase-root.MuiInputBase-root": {
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: theme.spacing(1),
        },
        "&& .MuiInputBase-root .MuiAutocomplete-input.MuiAutocomplete-input": {
          padding: 0,
        },
        "&& .MuiAutocomplete-endAdornment": {
          right: theme.spacing(0.5),
        },
      }),
      popupIndicator: ({ theme }) => ({
        opacity: theme.palette.opacity.helper,
      }),
      paper: ({ theme }) => ({
        ...menuPaperStyles(theme),
        ...theme.typography.body1,
      }),
      listbox: ({ theme }) => ({
        ...menuListStyles(theme),
        // Figma: the list scrolls past dialog/width/xs.
        maxHeight: 336,
        // The option rules sit under the listbox so they outrank MUI's own listbox option rules.
        "& .MuiAutocomplete-option": {
          ...menuItemStyles(theme),
          // MUI pads options 16px with a 48px touch height.
          minHeight: theme.spacing(3.5),
          padding: theme.spacing(0.75, 1),
        },
      }),
      groupLabel: ({ theme }) => ({
        backgroundColor: "transparent",
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
      }),
      groupUl: ({ theme }) => ({
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing(0.5),
        paddingTop: theme.spacing(0.5),
        "& .MuiAutocomplete-option": {
          paddingLeft: theme.spacing(1),
        },
      }),
      noOptions: ({ theme }) => ({
        ...theme.typography.body1,
        color: theme.palette.text.secondary,
        padding: theme.spacing(1.25, 1.5),
      }),
      loading: ({ theme }) => ({
        ...theme.typography.body1,
        color: theme.palette.text.secondary,
        padding: theme.spacing(1.25, 1.5),
      }),
    },
  }
}
