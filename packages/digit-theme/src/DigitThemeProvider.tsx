import React, { useEffect, useMemo, useState } from "react"

import CssBaseline from "@mui/material/CssBaseline"
import { createTheme, ThemeProvider } from "@mui/material/styles"

import { applyThemeCssVariables } from "./cssVariables"
import { themeOptions } from "./themeOptions"

declare global {
  interface Window {
    DigitHost?: {
      getSettings: () =>
        | { theme?: "light" | "dark"; language?: string }
        | null
      onSettingsChange: (
        cb: (s: { theme?: "light" | "dark"; language?: string }) => void,
      ) => () => void
    }
  }
}

function resolveDarkMode(): boolean {
  const host = window.DigitHost?.getSettings()?.theme
  if (host === "dark") return true
  if (host === "light") return false
  const attr = document.documentElement.dataset.theme
  if (attr === "dark") return true
  if (attr === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function DigitThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [darkMode, setDarkMode] = useState(resolveDarkMode)

  useEffect(() => {
    const unsub = window.DigitHost?.onSettingsChange((s) => {
      if (s.theme === "dark") setDarkMode(true)
      else if (s.theme === "light") setDarkMode(false)
    })

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onMediaChange = () => {
      if (!window.DigitHost?.getSettings()?.theme) {
        setDarkMode(resolveDarkMode())
      }
    }
    media.addEventListener("change", onMediaChange)

    setDarkMode(resolveDarkMode())
    return () => {
      unsub?.()
      media.removeEventListener("change", onMediaChange)
    }
  }, [])

  useEffect(() => {
    applyThemeCssVariables(darkMode)
  }, [darkMode])

  const theme = useMemo(() => createTheme(themeOptions(darkMode)), [darkMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
