const DETAIL_INSET_ATTR = "data-detail-inset"
const DETAIL_INSET_MULTILINE_ATTR = "data-detail-inset-multiline"
const DETAIL_INSET_BORDERLESS_ATTR = "data-detail-inset-borderless"

export type DetailInsetMode = "default" | "multiline" | "borderless" | false

export const getDetailInsetProps = (
  mode: DetailInsetMode,
): Record<string, string> | undefined => {
  if (mode === "default") {
    return { [DETAIL_INSET_ATTR]: "" }
  }
  if (mode === "multiline") {
    return { [DETAIL_INSET_MULTILINE_ATTR]: "" }
  }
  if (mode === "borderless") {
    return { [DETAIL_INSET_BORDERLESS_ATTR]: "" }
  }
  return undefined
}

export const resolveDetailInsetMode = ({
  removeBorder,
  noBorder,
  horizontal,
  multiline,
}: {
  removeBorder?: boolean
  noBorder?: boolean
  horizontal?: boolean
  multiline?: boolean
}): DetailInsetMode => {
  const borderless = removeBorder || noBorder
  if (!borderless) {
    return false
  }
  if (horizontal) {
    return "borderless"
  }
  return multiline ? "multiline" : "default"
}
