import React, { useEffect, useMemo, useState } from "react"

import CssBaseline from "@mui/material/CssBaseline"
import GlobalStyles from "@mui/material/GlobalStyles"
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles"

import { applyThemeCssVariables } from "./cssVariables.js"
import { themeOptions } from "./themeOptions.js"

import { AppHost } from "../host/index.js"

// The Inter font stylesheet is imported by the package's browser entry (src/index.ts)

function resolveDarkMode(): boolean {
  const host = AppHost.getSettings()?.theme
  if (host === "dark") return true
  if (host === "light") return false
  const attr = document.documentElement.dataset.theme
  if (attr === "dark") return true
  if (attr === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Sutton MUI theme for custom apps: palette, typography, component overrides, and Inter.
 * Follows the host's light/dark setting (`AppHost`), falling back to the OS preference.
 */
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [darkMode, setDarkMode] = useState(resolveDarkMode)

  useEffect(() => {
    const unsub = AppHost.onSettingsChange((s) => {
      if (s?.theme === "dark") setDarkMode(true)
      else if (s?.theme === "light") setDarkMode(false)
    })

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onMediaChange = () => {
      if (!AppHost.getSettings()?.theme) {
        setDarkMode(resolveDarkMode())
      }
    }
    media.addEventListener("change", onMediaChange)

    setDarkMode(resolveDarkMode())
    return () => {
      unsub()
      media.removeEventListener("change", onMediaChange)
    }
  }, [])

  useEffect(() => {
    applyThemeCssVariables(darkMode)
  }, [darkMode])

  const theme = useMemo(() => createTheme(themeOptions(darkMode)), [darkMode])

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {/* MuiInputBase disables MUI's injected autofill keyframes; web restores them here. */}
      <GlobalStyles
        styles={{
          "@keyframes mui-auto-fill": { from: { display: "block" } },
          "@keyframes mui-auto-fill-cancel": { from: { display: "block" } },
        }}
      />
      {children}
    </MuiThemeProvider>
  )
}

/** @deprecated Use `ThemeProvider`. Kept so existing apps keep working. */
export const DigitThemeProvider = ThemeProvider
