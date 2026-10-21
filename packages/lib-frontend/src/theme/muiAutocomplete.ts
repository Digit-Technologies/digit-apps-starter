import { createElement } from "react"

import { Components, Theme } from "@mui/material/styles"

import { ChevronDown, X } from "../icons"

import { menuListStyles, menuPaperStyles } from "./muiMenu"
import { menuItemStyles } from "./muiMenuItem"

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
      root: {
        fontSize: "0.8125rem", // body2
        "& ::placeholder": {
          fontSize: "0.8125rem", // body2
        },
      },
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
