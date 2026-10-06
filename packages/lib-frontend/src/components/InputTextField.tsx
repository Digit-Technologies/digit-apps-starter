import React, { useId } from "react"

import { ErrorMessage } from "@hookform/error-message"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import FormHelperText from "@mui/material/FormHelperText"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { SxProps, Theme, styled, useTheme } from "@mui/material/styles"
import getSymbolFromCurrency from "currency-symbol-map"
import { Pencil } from "lucide-react"
import {
  Controller,
  type FieldErrors,
  type UseFormRegister,
  useWatch,
} from "react-hook-form"

import { neutral } from "../theme/colors"

import { IconWrapper } from "./IconWrapper"
import InfoTooltip from "./InfoTooltip"
import Label from "./Label"
import { getDetailInsetProps, resolveDetailInsetMode } from "./detailInset"
import {
  horizontalRowSx,
  horizontalTextLabelSx,
  horizontalTextValueSx,
} from "./horizontalFieldStyles"

export const InputContainerDiv = styled(Stack)<{ theme?: Theme }>(() => ({
  display: "flex",
  flex: 1,
  flexDirection: "column",
}))

const DEFAULT_ACTION_LABEL = "Edit"

function currencySymbol(currencyCode: string): string {
  return getSymbolFromCurrency(currencyCode) || currencyCode
}

export interface InputTextFieldProps {
  /**
   * react-hook-form control. `any` matches digit-web so every form's control
   * is accepted (`Control` is invariant).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  name: string

  actionFn?: () => void
  /** Defaults to "Edit" (digit-web's `edit` string, without i18n). */
  actionTooltip?: string
  additionalLowerHorizontalLabel?: string
  additionalUpperHorizontalLabel?: string
  chip?: string
  /** ISO currency code. Symbol comes from `currency-symbol-map`, same as digit-web. */
  currencyCode?: string
  defaultValue?: string | number
  disabled?: boolean
  endAdornment?: string | React.ReactNode
  endAdornmentLowercase?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: FieldErrors<any>
  helperText?: string
  horizontal?: boolean
  startAdornment?: string | React.ReactNode
  label?: string | React.ReactNode
  loading?: boolean
  multiline?: boolean
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onChange?: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
  transformValue?: (value: string) => string
  placeholder?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register?: UseFormRegister<any>
  removeBorder?: boolean
  required?: boolean
  rows?: number
  sx?: SxProps<Theme>
  sxInput?: SxProps<Theme>
  sxLabel?: SxProps<Theme>
  sxLabelWrapper?: SxProps<Theme>
  sxValueWrapper?: SxProps<Theme>
  sxWrapper?: SxProps<Theme>
  tooltip?: string
  type?: string
  showDisabledBg?: boolean
  withFieldBg?: boolean
  /** Only for rare cases when the label isn't visible */
  ariaLabel?: string
}

export function InputTextField({
  actionFn,
  actionTooltip,
  additionalLowerHorizontalLabel,
  additionalUpperHorizontalLabel,
  chip,
  control,
  currencyCode,
  defaultValue = "",
  disabled,
  endAdornment,
  endAdornmentLowercase = true,
  errors,
  helperText,
  horizontal,
  startAdornment,
  label,
  loading,
  multiline,
  name,
  onBlur = () => {},
  onKeyDown = () => {},
  onChange,
  transformValue,
  placeholder,
  register,
  removeBorder,
  required,
  rows,
  sx,
  sxInput = {},
  sxLabel,
  sxLabelWrapper,
  sxValueWrapper,
  sxWrapper,
  tooltip,
  type,
  showDisabledBg = true,
  withFieldBg,
  ariaLabel,
}: InputTextFieldProps) {
  const id = useId()
  const theme = useTheme()
  const disabledBg = theme.palette.mode === "dark" ? neutral[900] : neutral[100]
  const actionLabel = actionTooltip ?? DEFAULT_ACTION_LABEL
  const fieldErrors = errors ?? {}

  const watchedValue = useWatch({
    control,
    name,
    defaultValue,
  })

  const detailInsetMode = resolveDetailInsetMode({
    removeBorder,
    horizontal,
    multiline,
  })

  const wrapperStyling: SxProps<Theme> = horizontal
    ? {
        backgroundColor:
          (disabled && showDisabledBg) || withFieldBg ? disabledBg : "inherit",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        ...horizontalRowSx,
        ...sxWrapper,
        ...(disabled && showDisabledBg ? { borderRadius: 0 } : {}),
      }
    : sxWrapper || {}
  const labelStyling = horizontal
    ? ({
        mb: 0,
        ...sxLabel,
      } as const)
    : detailInsetMode
      ? { mb: 0, ...sxLabel }
      : sxLabel || {}
  const inputStyling: SxProps<Theme> = horizontal
    ? {
        backgroundColor: "inherit",
        ml: "auto",
        flex: 1,
        minWidth: 0,
        "& .MuiInputBase-root": {
          minWidth: 0,
          ...(disabled ? { backgroundColor: "transparent" } : {}),
        },
        "& input": {
          fontSize: "13px",
          minHeight: "21px",
          p: 1,
          textAlign: "right",
          ...(!multiline
            ? {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }
            : {}),
        },
        "& input[type=number]": {
          MozAppearance: "textfield",
        },
        "& input[type=number]::-webkit-outer-spin-button": {
          WebkitAppearance: "none",
          margin: 0,
        },
        "& input[type=number]::-webkit-inner-spin-button": {
          WebkitAppearance: "none",
          margin: 0,
        },
        ".MuiInputBase-adornedStart": {
          px: 1,
        },
        ".MuiInputBase-adornedEnd": {
          px: 1,
        },
        ...sx,
      }
    : {
        backgroundColor: disabled && showDisabledBg ? disabledBg : "inherit",
        borderRadius: "4px",
        p: disabled && showDisabledBg ? 1 : 0,
        "& input": {
          fontSize: "13px",
          height: "inherit",
          ...(detailInsetMode ? { p: 0 } : { p: 1 }),
        },
        "& input[type=number]": {
          MozAppearance: "textfield",
        },
        "& input[type=number]::-webkit-outer-spin-button": {
          WebkitAppearance: "none",
          margin: 0,
        },
        "& input[type=number]::-webkit-inner-spin-button": {
          WebkitAppearance: "none",
          margin: 0,
        },
        ".MuiInputBase-adornedStart": {
          px: 1,
        },
        ".MuiInputBase-adornedEnd": {
          px: 1,
        },
        ...sx,
      }

  const startInputAdornment = (currencyCode || startAdornment) && (
    <InputAdornment position="start" sx={{ pt: "1px" }}>
      <Typography variant="body1">
        {currencyCode && currencySymbol(currencyCode)}
        {startAdornment && startAdornment}
      </Typography>
    </InputAdornment>
  )

  const endAdornmentIsPrimitive =
    typeof endAdornment === "string" || typeof endAdornment === "number"

  const endInputAdornment = endAdornment && (
    <InputAdornment
      position="end"
      sx={{
        textTransform:
          endAdornmentLowercase && endAdornmentIsPrimitive
            ? "lowercase"
            : "none",
        ...(!endAdornmentIsPrimitive ? { pointerEvents: "auto" } : {}),
      }}
    >
      {endAdornmentIsPrimitive ? (
        <Typography variant="body1">{endAdornment}</Typography>
      ) : (
        endAdornment
      )}
    </InputAdornment>
  )

  const labelBlock = (hideLabelForAria: boolean, showAction: boolean) =>
    (label || helperText) && (
      <Stack
        sx={
          horizontal
            ? { ...horizontalTextLabelSx, ...sxLabelWrapper }
            : sxLabelWrapper
        }
      >
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexWrap: "nowrap",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          {label && !(hideLabelForAria && ariaLabel) && (
            <Label
              required={required}
              sx={{ ...labelStyling, flex: "0 0 auto" }}
              htmlFor={id}
              title={typeof label === "string" ? label : undefined}
            >
              {label}
              {chip && (
                <Chip
                  label={chip}
                  size="small"
                  sx={{ fontSize: "10px", height: "20px", ml: 1.5 }}
                />
              )}
            </Label>
          )}
          {tooltip && (
            <InfoTooltip sx={{ flexShrink: 0, ml: 1 }} text={tooltip} />
          )}
          {showAction && actionFn && (
            <Tooltip title={actionLabel}>
              <IconButton
                aria-label={actionLabel}
                size="small"
                sx={{
                  ml: 1,
                  opacity: 0,
                  transition: "opacity 200ms ease-in",
                  p: 0.25,
                }}
                onClick={() => actionFn()}
              >
                <IconWrapper size={14}>
                  <Pencil />
                </IconWrapper>
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {helperText && (
          <FormHelperText sx={{ mb: 0.5, whiteSpace: "normal" }}>
            {helperText}
          </FormHelperText>
        )}
      </Stack>
    )

  if (loading) {
    return (
      <InputContainerDiv
        {...getDetailInsetProps(detailInsetMode)}
        sx={wrapperStyling}
      >
        {labelBlock(true, false)}
        <Skeleton>
          <Stack
            sx={
              horizontal
                ? { ...horizontalTextValueSx, ...sxValueWrapper }
                : sxValueWrapper
            }
          >
            {additionalUpperHorizontalLabel && horizontal && (
              <Typography variant="caption">
                {additionalUpperHorizontalLabel}
              </Typography>
            )}
            <TextField
              data-testid="skeleton-input"
              id={id}
              label={ariaLabel ? undefined : label}
              size="small"
              sx={{ width: "100%", ...inputStyling }}
              variant="outlined"
              disabled
              slotProps={{
                input: {
                  endAdornment: endInputAdornment,
                  startAdornment: startInputAdornment,
                  sx: removeBorder
                    ? {
                        p: 0,
                        "& fieldset": {
                          border: "none",
                          p: 0,
                        },
                      }
                    : {},
                },
                htmlInput: {
                  "aria-label": ariaLabel,
                },
              }}
            />
          </Stack>
        </Skeleton>
      </InputContainerDiv>
    )
  }

  return (
    <InputContainerDiv
      {...getDetailInsetProps(detailInsetMode)}
      sx={{
        gap: horizontal ? 1 : 0,
        "&:hover button": { opacity: 1 },
        "&:focus-within button": { opacity: 1 },
        ...wrapperStyling,
      }}
    >
      {labelBlock(false, true)}
      <Controller
        control={control}
        defaultValue={defaultValue}
        name={name}
        key={name}
        render={({ field }) => (
          <Stack
            sx={
              horizontal
                ? { ...horizontalTextValueSx, ...sxValueWrapper }
                : sxValueWrapper
            }
          >
            {additionalUpperHorizontalLabel && horizontal && (
              <Typography variant="caption" sx={{ ml: "auto", mb: 0.5 }}>
                {additionalUpperHorizontalLabel}
              </Typography>
            )}
            <TextField
              id={id}
              autoComplete="off"
              data-testid="textfield-input"
              disabled={disabled}
              error={Boolean(fieldErrors[name])}
              multiline={multiline}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              rows={rows}
              size="small"
              sx={{ width: "100%", ...inputStyling }}
              type={type}
              variant="outlined"
              onBlur={(e) => {
                field.onBlur()
                onBlur?.(e as React.FocusEvent<HTMLInputElement>)
              }}
              onChange={(
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
              ) => {
                if (transformValue) {
                  const input = e.target
                  const transformed = transformValue(input.value)
                  if (transformed !== input.value) {
                    const { selectionStart, selectionEnd } = input
                    input.value = transformed
                    input.setSelectionRange(selectionStart, selectionEnd)
                  }
                }
                field.onChange(e)
                onChange?.(e)
              }}
              value={watchedValue ?? field.value ?? ""}
              name={field.name}
              {...(register ? register(name) : {})}
              slotProps={{
                input: {
                  endAdornment: endInputAdornment,
                  startAdornment: startInputAdornment,
                  sx: (removeBorder
                    ? {
                        p: 0,
                        "& fieldset": {
                          border: "none",
                          p: 0,
                        },
                        ...sxInput,
                        "& input": {
                          ...sxInput,
                        },
                      }
                    : { ...sxInput, "& input": { ...sxInput } }) as SxProps<Theme>,
                },
                htmlInput: {
                  "aria-label": ariaLabel,
                },
              }}
            />

            {additionalLowerHorizontalLabel && horizontal && (
              <Typography variant="caption" sx={{ ml: "auto", mt: 1 }}>
                {additionalLowerHorizontalLabel}
              </Typography>
            )}

            <ErrorMessage
              errors={fieldErrors}
              name={name}
              render={({ message }) => (
                <FormHelperText
                  error
                  sx={{
                    textAlign: horizontal ? "right" : "left",
                  }}
                >
                  {message}
                </FormHelperText>
              )}
            />
          </Stack>
        )}
      />
    </InputContainerDiv>
  )
}
