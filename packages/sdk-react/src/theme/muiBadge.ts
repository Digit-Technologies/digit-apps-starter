import { Components, Theme } from "@mui/material/styles"

// Figma has no badge atom. The count next to a label is the Button/Tab "counter": the label's own
// text style at the helper opacity (60%), 4px after the label. Use
// <Badge variant="count" badgeContent={3}>Label</Badge>; inside a Button or Tab it takes that
// control's font. The standard and dot variants stay small corner overlays in the palette colour
// (`color="error"` and so on; the default colour is the primary text colour on paper).
export const muiBadge = (): Components<Omit<Theme, "components">>["MuiBadge"] => ({
  styleOverrides: {
    badge: ({ ownerState, theme }) => ({
      // Figma pill/Sm text (11/12 500) on a 16px capsule; the dot is 8px.
      ...theme.typography.pillSm,
      boxSizing: "border-box",
      height: theme.spacing(2),
      minWidth: theme.spacing(2),
      padding: `0 ${theme.spacing(0.5)}`,
      borderRadius: theme.spacing(1),
      ...((ownerState.color ?? "default") === "default" && {
        backgroundColor: theme.palette.text.primary,
        color: theme.palette.background.paper,
      }),
    }),
    dot: ({ theme }) => ({
      height: theme.spacing(1),
      minWidth: theme.spacing(1),
      padding: 0,
      borderRadius: theme.spacing(0.5),
    }),
  },
  variants: [
    {
      props: { variant: "count" },
      style: ({ theme }) => ({
        alignItems: "baseline",
        verticalAlign: "baseline",
        "& .MuiBadge-badge": {
          position: "static",
          transform: "none",
          display: "inline",
          marginLeft: theme.spacing(0.5),
          height: "auto",
          minWidth: 0,
          padding: 0,
          borderRadius: 0,
          font: "inherit",
          color: "inherit",
          backgroundColor: "transparent",
          opacity: theme.palette.opacity.helper,
        },
        "& .MuiBadge-invisible": {
          display: "none",
        },
      }),
    },
  ],
})
