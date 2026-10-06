/**
 * Horizontal (label left, value right) layout used by InputTextField.
 * Text/number use a 66/33 split. Date/select variants stay on digit-web.
 */

const labelEllipsisSx = {
  "& .MuiStack-root": {
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    width: "100%",
  },
  "& .MuiInputLabel-root": {
    display: "block",
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
} as const

/** Constrain the row so long values cannot grow the sidebar. */
export const horizontalRowSx = {
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  width: "100%",
} as const

/** Name column for text/number: 2/3 of the row, ellipsis when it runs out. */
export const horizontalTextLabelSx = {
  flex: "2 1 0%",
  maxWidth: "66%",
  minWidth: 0,
  overflow: "hidden",
  pr: 1,
  width: "66%",
  ...labelEllipsisSx,
} as const

/** Value column for text/number: 1/3 of the row, right-aligned. */
export const horizontalTextValueSx = {
  boxSizing: "border-box",
  flex: "1 1 0%",
  maxWidth: "33%",
  minWidth: 0,
  width: "33%",
} as const
