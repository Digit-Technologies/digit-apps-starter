import { SxProps, Theme } from "@mui/material/styles"

/** Figma inset field row height (28px) for detail paper form rows. */
export const DETAIL_INSET_FIELD_HEIGHT_SPACING = 3.5

/** Vertical gap between label, controls, and detail lines in paper sections. */
export const detailPaperSectionStackSx: SxProps<Theme> = {
  gap: 0.25,
}

/** Icon + value column; icon aligns to the title row only (not detail lines below). */
export const detailPaperIconRowSx: SxProps<Theme> = {
  alignItems: "flex-start",
  flexDirection: "row",
  gap: 0.25,
}

/** 16px leading icon centered on the inset title row (28px), not the full field stack. */
export const detailPaperLeadingIconSx: SxProps<Theme> = {
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  height: (theme: Theme) => theme.spacing(DETAIL_INSET_FIELD_HEIGHT_SPACING),
  minHeight: (theme: Theme) => theme.spacing(DETAIL_INSET_FIELD_HEIGHT_SPACING),
}

export const detailPaperLeadingIconColor = (theme: Theme): string =>
  theme.palette.text.primary

/** Stack beside the leading icon in a detail paper field row. */
export const detailPaperFieldStackSx: SxProps<Theme> = {
  flex: 1,
  gap: 0.25,
  minWidth: 0,
}

/** Stacked secondary lines (street, email, phone) with minimal gap. */
export const detailPaperDetailLinesStackSx: SxProps<Theme> = {
  gap: 0,
}

/** Tighter line height for secondary detail lines under a control. */
export const detailPaperCompactTextSx: SxProps<Theme> = {
  display: "block",
  lineHeight: 1.25,
  margin: 0,
}

/** Label left, switch right — billing same as shipping. */
export const detailPaperSwitchRowSx: SxProps<Theme> = {
  alignItems: "center",
  flexDirection: "row",
  gap: 1,
  justifyContent: "space-between",
  p: 0,
}

/** Section column labels (Customer, Ship to, Bill to) — heading/level-6. */
export const detailPaperSectionLabelSx: SxProps<Theme> = {
  mb: 0,
}

/** Compact inset section (e.g. shipping & delivery title + field row). */
export const detailInsetSectionStackSx: SxProps<Theme> = {
  gap: 1,
}

/** Compact inset fields — pair with direction={{ xs: "column", md: "row" }}. */
export const detailInsetFieldRowSx: SxProps<Theme> = {
  alignItems: { xs: "stretch", md: "flex-end" },
  gap: 1,
}

/** Single field in a compact inset field row. */
export const detailInsetFieldColumnSx: SxProps<Theme> = {
  flex: { xs: "none", md: "1 1 0" },
  minWidth: 0,
  overflow: { xs: "visible", md: "hidden" },
  width: { xs: "100%", md: "auto" },
}

const DETAIL_PAGE_CONTENT_PADDING_SPACING = 4
const DETAIL_PAGE_CONTENT_PADDING_SPACING_MOBILE = 2

export const getDetailContentHorizontalPadding = (
  inModal?: boolean,
): number | { xs: number; md: number } =>
  inModal
    ? 0
    : {
        xs: DETAIL_PAGE_CONTENT_PADDING_SPACING_MOBILE,
        md: DETAIL_PAGE_CONTENT_PADDING_SPACING,
      }

export const detailInsetSectionContainerSx = (
  theme: Theme,
  options?: { inModal?: boolean },
): Record<string, unknown> => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  pb: 2,
  pt: 2,
  px: getDetailContentHorizontalPadding(options?.inModal),
})

const detailPaperColumnDividerSx = (theme: Theme): Record<string, unknown> => ({
  alignSelf: "stretch",
  [theme.breakpoints.up("sm")]: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  [theme.breakpoints.down("sm")]: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
})

const detailPaperColumnPb = 1

export const detailPaperColumnBoxSx = (
  theme: Theme,
  { divider = false }: { divider?: boolean } = {},
): Record<string, unknown> => ({
  flex: 1,
  minWidth: 0,
  pb: detailPaperColumnPb,
  pt: 2,
  ...(divider ? detailPaperColumnDividerSx(theme) : {}),
})
