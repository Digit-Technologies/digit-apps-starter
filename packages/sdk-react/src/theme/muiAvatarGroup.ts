import { Components, Theme } from "@mui/material/styles"

// Avatar stacks in the mockups (Roles list "10 Users", Home summary cards) are 16px people that
// overlap by 4. MUI's group adds a 2px page-colour border in content-box sizing, which would make
// each avatar 20px and hide the Figma a.10 border; a 1px paper ring separates them instead.
// Pass `sx={{ "--digit-avatar-size": "20px" }}` on the group for a larger stack.
export const muiAvatarGroup = (): Components<Omit<Theme, "components">>["MuiAvatarGroup"] => ({
  defaultProps: {
    spacing: 4,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      "--digit-avatar-size": theme.spacing(2),
      alignItems: "center",
      "& .MuiAvatar-root": {
        boxSizing: "border-box",
        border: `1px solid ${theme.palette.border.strong}`,
        boxShadow: `0 0 0 1px ${theme.palette.background.paper}`,
      },
    }),
  },
})
