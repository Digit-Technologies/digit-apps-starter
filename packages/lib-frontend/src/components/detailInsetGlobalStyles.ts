import { CSSObject, Theme } from "@mui/material/styles"

import { DETAIL_INSET_FIELD_HEIGHT_SPACING } from "./detailInsetFieldStyles"

const insetFieldHeight = (theme: Theme): string =>
  theme.spacing(DETAIL_INSET_FIELD_HEIGHT_SPACING)

/**
 * Global styles for detail-paper inset fields. Applied when a form wrapper sets
 * `data-detail-inset` (or `data-detail-inset-multiline` for notes).
 */
export const detailInsetGlobalStyleOverrides = (theme: Theme): CSSObject => {
  const fieldHeight = insetFieldHeight(theme)
  const subtitle2LineHeight = theme.typography.subtitle2.lineHeight

  return {
    "[data-detail-inset]": {
      gap: theme.spacing(0.25),
      width: "100%",

      "& > .MuiInputLabel-root": {
        display: "block",
        lineHeight: subtitle2LineHeight,
        marginBottom: 0,
        minHeight: subtitle2LineHeight,
      },

      "& .MuiInputLabel-root": {
        left: 0,
        marginBottom: 0,
        marginLeft: 0,
        maxWidth: "100%",
        paddingLeft: 0,
        paddingRight: 0,
        transform: "none",
      },

      "& .MuiInputBase-root": {
        alignItems: "center",
        boxSizing: "border-box",
        height: fieldHeight,
        minHeight: fieldHeight,
        paddingLeft: 0,
        paddingRight: 0,
        width: "100%",
      },

      "& .MuiAutocomplete-root .MuiInputBase-root": {
        alignContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: theme.spacing(0.5),
        height: "auto",
        minHeight: fieldHeight,
        paddingBottom: theme.spacing(0.25),
        paddingTop: theme.spacing(0.25),
        rowGap: theme.spacing(0.5),
      },

      "& .MuiAutocomplete-tag": {
        height: "auto",
        margin: 0,
        maxHeight: "none",
        minHeight: 24,
      },

      "& .MuiAutocomplete-tag.MuiChip-root": {
        height: "auto",
        minHeight: 24,
      },

      "& .MuiSelect-root": {
        width: "100%",
      },

      "& .MuiOutlinedInput-input": {
        paddingLeft: 0,
        textAlign: "left",
      },

      "& .MuiSelect-select": {
        alignItems: "center",
        boxSizing: "border-box",
        display: "flex",
        height: fieldHeight,
        minHeight: fieldHeight,
        paddingLeft: "0 !important",
        paddingTop: 0,
        paddingBottom: 0,
      },

      "& input": {
        paddingLeft: 0,
        paddingRight: 0,
        textAlign: "left",
      },

      "& input::placeholder, & .MuiInputBase-input::placeholder, & .MuiAutocomplete-input::placeholder":
        {
          color: theme.palette.text.secondary,
          opacity: 1,
          textAlign: "left",
        },

      "& .MuiInputAdornment-positionStart": {
        alignSelf: "center",
        marginLeft: 0,
      },

      "& .MuiInputAdornment-positionEnd": {
        alignSelf: "center",
        height: fieldHeight,
        marginRight: 0,
        maxHeight: fieldHeight,
      },

      "& .MuiInputAdornment-positionEnd .MuiIconButton-root": {
        backgroundColor: "transparent",
        borderRadius: 0,
        height: fieldHeight,
        margin: 0,
        minWidth: 0,
        padding: 0,
        width: "auto",
      },

      "& .MuiInputAdornment-positionEnd .MuiIconButton-root:hover": {
        backgroundColor: "transparent",
      },

      "& .MuiSelect-icon": {
        alignSelf: "center",
        height: "auto",
        top: "auto",
      },

      "& .MuiOutlinedInput-root.MuiInputBase-sizeSmall": {
        paddingTop: 0,
        paddingBottom: 0,
      },

      "& .MuiAutocomplete-root .MuiOutlinedInput-root.MuiInputBase-sizeSmall": {
        paddingBottom: theme.spacing(0.25),
        paddingTop: theme.spacing(0.25),
      },

      "& fieldset": {
        border: "none",
      },

      "& .MuiOutlinedInput-notchedOutline": {
        border: "none !important",
      },

      "& .MuiOutlinedInput-root.Mui-focused fieldset": {
        border: "none",
      },

      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
        border: "none",
      },

      "& .MuiOutlinedInput-root": {
        backgroundColor: "transparent",
      },

      "& .MuiAutocomplete-input": {
        minWidth: "8ch",
        paddingLeft: "0 !important",
      },

      "& .MuiFormHelperText-root": {
        marginLeft: 0,
        marginRight: 0,
        marginTop: theme.spacing(0.25),
      },

      "& .MuiPickersInputBase-root": {
        alignItems: "center",
        backgroundColor: "transparent",
        boxSizing: "border-box",
        display: "inline-flex",
        height: fieldHeight,
        maxWidth: "100%",
        minHeight: fieldHeight,
        minWidth: 0,
        paddingLeft: 0,
        paddingRight: 0,
        width: "auto",
      },

      "& .MuiPickersInputBase-root .MuiInputAdornment-root": {
        alignSelf: "center",
        flexShrink: 0,
        marginLeft: theme.spacing(0.5),
        marginRight: 0,
      },

      "& .MuiPickersInputBase-sectionsContainer": {
        alignItems: "center",
        flex: "0 1 auto",
        minWidth: 0,
        overflow: "hidden",
        paddingLeft: 0,
        paddingTop: 0,
        paddingBottom: 0,
        width: "auto",
      },

      "& .MuiPickersSectionList-sectionContent": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },

      "& .MuiPickersSectionList-root": {
        alignItems: "center",
        minHeight: fieldHeight,
        paddingTop: 0,
        paddingBottom: 0,
      },
    },

    "[data-detail-inset-borderless]": {
      "& fieldset": {
        border: "none",
      },
      "& .MuiOutlinedInput-notchedOutline": {
        border: "none !important",
      },
      "& .MuiOutlinedInput-root.Mui-focused fieldset": {
        border: "none",
      },
      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
        border: "none",
      },
      "& .MuiOutlinedInput-root": {
        backgroundColor: "transparent",
      },
      "& .MuiSelect-select": {
        paddingLeft: 0,
      },
    },

    "[data-detail-inset-multiline]": {
      width: "100%",

      "& .MuiInputBase-root": {
        alignItems: "flex-start",
        paddingLeft: 0,
        paddingRight: 0,
        width: "100%",
      },

      "& fieldset": {
        border: "none",
      },

      "& .MuiOutlinedInput-notchedOutline": {
        border: "none !important",
      },

      "& textarea": {
        paddingLeft: 0,
        paddingRight: 0,
      },
    },
  }
}
