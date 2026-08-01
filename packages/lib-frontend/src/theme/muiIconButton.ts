import { Components, Theme, alpha } from "@mui/material/styles"

import { neutral, red } from "./colors"
import { defaultTransition } from "./transitions"

export const muiIconButton = ({
  darkMode,
}: {
  darkMode: boolean
}): Components<Omit<Theme, "components">>["MuiIconButton"] => {
  return {
    defaultProps: {
      disableRipple: true,
      disableTouchRipple: true,
      disableFocusRipple: true,
      size: "small",
    },
    styleOverrides: {
      root: ({ theme }) => ({
        background: "transparent",
        border: "1px solid transparent",
        boxShadow: "none",
        color: theme.palette.text.secondary,
        gap: theme.spacing(1),
        lineHeight: "1rem", // 16px
        transition: defaultTransition(theme),
        whiteSpace: "nowrap",

        "& .MuiSvgIcon-root, & svg": {
          fontSize: "1em",
          stroke: "currentColor",
          [theme.breakpoints.down("md")]: {
            fontSize: "1.25em",
            width: "1.25em",
            height: "1.25em",
          },
        },

        "&:hover": {
          background: darkMode
            ? alpha(neutral.white, 0.1)
            : alpha(neutral.black, 0.05),
        },

        "&:active": {
          background: darkMode
            ? alpha(neutral.white, 0.05)
            : alpha(neutral.black, 0.1),
        },

        "&.Mui-disabled": {
          background: "transparent",
          border: "1px solid transparent!important",
          boxShadow: "none",
          color: theme.palette.text.disabled,
          opacity: 0.4,

          "& .MuiSvgIcon-root, & svg, & .MuiBox-root": {
            color: "inherit",
            opacity: 1,
            stroke: "currentColor",
          },
        },

        variants: [
          {
            props: { color: "error" },
            style: {
              "&:hover": {
                color: red[500],
                "& .MuiSvgIcon-root, & svg, & .MuiBox-root": {
                  color: red[500],
                  stroke: "currentColor",
                },
              },
              "&:active": {
                color: red[700],
                "& .MuiSvgIcon-root, & svg, & .MuiBox-root": {
                  color: red[700],
                  stroke: "currentColor",
                },
              },
            },
          },
        ],
      }),
      sizeSmall: ({ theme }) => ({
        borderRadius: "8px",
        height: "28px",
        minWidth: "28px",
        width: "28px",

        "& .MuiSvgIcon-root, & svg": {
          fontSize: "16px",
          height: "16px",
          width: "16px",
        },

        [theme.breakpoints.down("md")]: {
          borderRadius: "10px",
          height: "35px",
          minWidth: "35px",
          width: "35px",

          "& .MuiSvgIcon-root, & svg": {
            fontSize: "20px",
            height: "20px",
            width: "20px",
          },
        },
      }),
      sizeMedium: ({ theme }) => ({
        borderRadius: "10px",
        height: "36px",
        minWidth: "36px",
        width: "36px",

        "& .MuiSvgIcon-root, & svg": {
          fontSize: "20px",
          height: "20px",
          width: "20px",
        },

        [theme.breakpoints.down("md")]: {
          borderRadius: "12.5px",
          height: "45px",
          minWidth: "45px",
          width: "45px",

          "& .MuiSvgIcon-root, & svg": {
            fontSize: "25px",
            height: "25px",
            width: "25px",
          },
        },
      }),
    },
  }
}
