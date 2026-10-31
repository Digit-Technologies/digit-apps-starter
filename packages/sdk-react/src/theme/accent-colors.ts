import {
  amber,
  blue,
  cyan,
  emerald,
  fuchsia,
  green,
  indigo,
  lime,
  neutral,
  orange,
  pink,
  purple,
  red,
  rose,
  sky,
  stone,
  teal,
  violet,
  yellow,
} from "./colors.js"

type Scale = Record<number, string>

// The raw colour scales for each accent. Use these for tints; use `accentPalette` for roles.
export const accentScales = {
  red,
  orange,
  amber,
  yellow,
  lime,
  green,
  emerald,
  teal,
  cyan,
  sky,
  blue,
  indigo,
  violet,
  purple,
  fuchsia,
  pink,
  rose,
  stone,
} satisfies Record<string, Scale>

export type AccentColorName = keyof typeof accentScales

// Palette roles for the accent colours. Each one is a `theme.palette` entry, so MUI components
// take it as `color="purple"` and `sx` takes `"purple.main"`. The stone scale is the neutral
// grey, and it is also the default chip tone.
const contrastText: Record<AccentColorName, string> = {
  red: neutral.white,
  orange: neutral.white,
  amber: neutral.black,
  yellow: neutral.black,
  lime: neutral.black,
  green: neutral.white,
  emerald: neutral.white,
  teal: neutral.white,
  cyan: neutral.black,
  sky: neutral.black,
  blue: neutral.white,
  indigo: neutral.white,
  violet: neutral.white,
  purple: neutral.white,
  fuchsia: neutral.white,
  pink: neutral.white,
  rose: neutral.white,
  stone: neutral.white,
}

export const accentPalette = Object.fromEntries(
  (Object.keys(accentScales) as AccentColorName[]).map((name) => [
    name,
    {
      main: accentScales[name][500],
      light: accentScales[name][400],
      dark: accentScales[name][600],
      contrastText: contrastText[name],
    },
  ]),
) as Record<AccentColorName, { main: string; light: string; dark: string; contrastText: string }>
