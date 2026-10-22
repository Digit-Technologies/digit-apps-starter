import { Components, Theme } from "@mui/material/styles"

// Figma avatars (Icon section, 10380:23097): fill page/background/secondary (#fafafa / #1c1917),
// 1px avatar/border/default (a.10 / w.10). People are circles; company and item avatars are
// rounded squares with radius 4 at every size.
//
// Size: MUI Avatar has no size prop, so the size is the `--digit-avatar-size` custom property
// (default 20, the table/person avatar). Set it through sx and the initials and icon scale with
// it: `<Avatar sx={{ "--digit-avatar-size": "16px" }}>`. Figma sizes are 12, 16, 20, 28, 36, 44;
// apps mostly need 16 (inline and stacks), 20 (rows), 28 (logo upload) and 36 (item with meta).
const avatarSize = (theme: Theme) => `var(--digit-avatar-size, ${theme.spacing(2.5)})`

export const muiAvatar = (): Components<Omit<Theme, "components">>["MuiAvatar"] => ({
  styleOverrides: {
    root: ({ theme }) => {
      const size = avatarSize(theme)
      return {
        width: size,
        height: size,
        boxSizing: "border-box",
        border: `1px solid ${theme.palette.border.strong}`,
        backgroundColor: theme.palette.background.secondary,
        color: theme.palette.text.secondary,
        // Initials at ~45% of the avatar (9px at 20, 16px at 36) and the icon at the Figma inset
        // size (~75%: 12 in 16, 16 in 20, 20 in 28, 28 in 36).
        fontSize: `calc(${size} * 0.45)`,
        fontWeight: 500,
        lineHeight: 1,
        "& > svg": { width: `calc(${size} * 0.75)`, height: `calc(${size} * 0.75)` },
      }
    },
    circular: { borderRadius: "50%" },
    rounded: ({ theme }) => ({ borderRadius: theme.spacing(0.5) }),
  },
})
