import React, { useEffect, useMemo, useState } from "react"

import CssBaseline from "@mui/material/CssBaseline"
import GlobalStyles from "@mui/material/GlobalStyles"
import { createTheme, ThemeProvider } from "@mui/material/styles"

import { applyThemeCssVariables } from "./cssVariables"
import { themeOptions } from "./themeOptions"

import { AppHost } from "../host"

// Self-hosted Inter variable (inter-ui), same face digit-web loads. The pack
// build rewrites the font URLs onto /app/ so they are font-src 'self'.
import "inter-ui/inter-variable.css"

function resolveDarkMode(): boolean {
  const host = AppHost.getSettings()?.theme
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* MuiInputBase disables MUI's injected autofill keyframes; web restores them here. */}
      <GlobalStyles
        styles={{
          "@keyframes mui-auto-fill": { from: { display: "block" } },
          "@keyframes mui-auto-fill-cancel": { from: { display: "block" } },
        }}
      />
      {children}
    </ThemeProvider>
  )
}
