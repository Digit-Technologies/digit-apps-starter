import { Components, Theme } from "@mui/material/styles"

import { neutral, neutralAlpha, blue, violet, stone } from "./colors"
import { outer } from "./shadows"

export const muiSwitch = (): Components<
  Omit<Theme, "components">
>["MuiSwitch"] => {
  return {
    styleOverrides: {
      root: ({ theme }) => ({
        width: theme.spacing(4.5),
        height: theme.spacing(4.5),
        padding: theme.spacing(1.25, 0),
        borderRadius: 0,

        "& .MuiSwitch-switchBase": {
          padding: theme.spacing(0.25),
          margin: 0,
          top: "unset",

          "&.Mui-focusVisible": {
            outline: `2px auto ${violet[500]}`,
            outlineOffset: 2,
          },

          "&.Mui-checked": {
            transform: `translateX(${theme.spacing(2)})`,
            color: neutral.white,
            "& + .MuiSwitch-track": {
              opacity: 1,
              border: 0,
            },
            "&.Mui-disabled + .MuiSwitch-track": {
              opacity: theme.palette.opacity.disabled,
            },
          },
          "&.Mui-disabled .MuiSwitch-thumb": {
            color: stone[50],
            ...theme.applyStyles("dark", {
              color: stone[750],
            }),
          },
          "&.Mui-disabled + .MuiSwitch-track": {
            opacity: theme.palette.opacity.disabled,
          },
        },
        "& .MuiSwitch-thumb": {
          boxSizing: "border-box",
          width: theme.spacing(1.5),
          height: theme.spacing(1.5),
          boxShadow: outer.sm,
          background: neutral.white,
          border: `1px solid ${neutralAlpha.darken[200]}`,
        },
        "&:active .MuiSwitch-thumb": {
          background: stone[100],
          ...theme.applyStyles("dark", {
            background: stone[700],
          }),
        },
        "& .MuiSwitch-track": {
          borderRadius: theme.spacing(2),
          backgroundColor: stone[100],
          border: `1px solid ${neutralAlpha.darken[100]}`,
          opacity: 1,
          height: theme.spacing(2),
          width: theme.spacing(4),
          ...theme.applyStyles("dark", {
            backgroundColor: stone[600],
            border: `1px solid ${neutralAlpha.lighten[100]}`,
          }),
        },
        "&:hover .MuiSwitch-track": {
          backgroundColor: stone[150],
          ...theme.applyStyles("dark", {
            backgroundColor: stone[650],
          }),
        },
        "&:active .MuiSwitch-track": {
          backgroundColor: stone[200],
          ...theme.applyStyles("dark", {
            backgroundColor: stone[700],
          }),
        },
        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
          backgroundColor: blue[500],
          ...theme.applyStyles("dark", {
            backgroundColor: blue[500],
          }),
        },
        "& .MuiSwitch-switchBase.Mui-checked:hover + .MuiSwitch-track": {
          backgroundColor: blue[550],
          ...theme.applyStyles("dark", {
            backgroundColor: blue[550],
          }),
        },
        "& .MuiSwitch-switchBase.Mui-checked:active + .MuiSwitch-track": {
          backgroundColor: blue[600],
          ...theme.applyStyles("dark", {
            backgroundColor: blue[600],
          }),
        },
        "& .MuiSwitch-switchBase.Mui-disabled + .MuiSwitch-track": {
          backgroundColor: stone[50],
          ...theme.applyStyles("dark", {
            backgroundColor: stone[750],
          }),
        },
        "& .MuiSwitch-switchBase.Mui-checked.Mui-disabled + .MuiSwitch-track": {
          backgroundColor: blue[50],
          ...theme.applyStyles("dark", {
            backgroundColor: blue[750],
          }),
        },
      }),
    },
  }
}
