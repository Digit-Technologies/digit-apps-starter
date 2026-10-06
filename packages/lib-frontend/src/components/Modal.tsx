/*
Modal maxWidth values:
"xxs"	224px (14rem)
"xs"	360px
"sm"	600px (MUI default)
"md"	960px
"lg"	1280px
"xl"	1920px
false	No limit	(Expands to content)
*/

import React, { useId, useRef, useState } from "react"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog, { DialogProps } from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Stack from "@mui/material/Stack"
import { TypographyOwnProps } from "@mui/material/Typography"
import { useTheme, SxProps, Theme } from "@mui/material/styles"
import useMediaQuery from "@mui/material/useMediaQuery"
import { ChevronDown, X } from "lucide-react"

import { red } from "../theme/colors"

import HelperText from "./HelperText"
import { IconWrapper } from "./IconWrapper"
import LoadingButton from "./LoadingButton"
import { useWindowResize } from "./useWindowResize"

export const MODAL_HORIZONTAL_PADDING = { xs: 1.5, md: 2.5 } as const

/**
 * Desktop top/bottom inset. digit-web reads this from BaseTable's
 * `BACKUP_HEIGHT` (40). Inlined so Studio modals don't depend on AG Grid.
 */
const MODAL_EDGE_INSET_PX = 40

/** digit-web `components.modal_hasErrors`, without i18n. */
const DEFAULT_ERROR_TEXT =
  "Fix errors in highlighted fields before submitting."

type MenuOption = {
  action: () => void
  text: string
  node?: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

export interface ModalProps extends Omit<DialogProps, "maxWidth"> {
  children: React.ReactNode
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>

  additionalActions?: React.ReactNode
  additionalTitle?: React.ReactNode
  altClosingAction?: () => void
  buttonColor?: "primary" | "secondary"
  danger?: boolean
  disabled?: boolean
  /** MUI 9 Dialog no longer takes this prop; escape is ignored in `onClose`. */
  disableEscapeKeyDown?: boolean
  fullWidth?: boolean
  hasError?: boolean
  /** Shown when `hasError` is set. Defaults to the English web string. */
  errorText?: string
  hideBottomActions?: boolean
  hideCloseIcon?: boolean
  loadingButton?: boolean
  mainCtaAction?: () => void
  mainCtaButtonStartIcon?: React.ReactNode
  mainCtaText?: string
  mainCtaButtonEndIcon?: React.ReactNode
  maxWidth?: "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | false
  menuButtonOptions?: MenuOption[]
  otherClosingActions?: () => void
  sx?: SxProps<Theme>
  sxActions?: SxProps<Theme>
  sxCloseIcon?: SxProps<Theme>
  sxContent?: SxProps<Theme>
  sxPaperProps?: SxProps<Theme>
  title?: string
  titleNode?: React.ReactNode
  titleVariant?: TypographyOwnProps["variant"]
  topActions?: React.ReactNode
}

export function Modal({
  additionalActions,
  additionalTitle,
  altClosingAction,
  buttonColor = "primary",
  children,
  danger,
  disabled,
  disableEscapeKeyDown = false,
  errorText = DEFAULT_ERROR_TEXT,
  fullWidth = false,
  hasError,
  hideBottomActions = false,
  hideCloseIcon = false,
  loadingButton,
  mainCtaAction,
  mainCtaButtonStartIcon,
  mainCtaText,
  mainCtaButtonEndIcon,
  menuButtonOptions,
  maxWidth = false,
  open,
  otherClosingActions,
  setOpen,
  sx,
  sxActions,
  sxCloseIcon,
  sxContent,
  sxPaperProps,
  title,
  titleNode,
  titleVariant = "h5",
  topActions,
}: ModalProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const descriptionId = useId()

  const horizontalPadding = MODAL_HORIZONTAL_PADDING

  const isXXS = maxWidth === "xxs"
  const dialogMaxWidth = isXXS ? false : maxWidth

  const hasTitleContent = Boolean(titleNode || title || additionalTitle)

  const dialogTitleRef = useRef<HTMLDivElement>(null)
  const [dialogTitleHeight, setDialogTitleHeight] = useState<number>(0)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const openMenu = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  useWindowResize(
    () => {
      if (dialogTitleRef.current) {
        setDialogTitleHeight(
          dialogTitleRef.current.getBoundingClientRect().height,
        )
      }
    },
    [title, titleNode, additionalTitle, isMobile],
    {
      immediate: true,
      delay: 100,
      enabled: open,
    },
  )

  const triggerMainAction = () => {
    if (mainCtaAction) {
      mainCtaAction()
    }
  }

  const closeModal = (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e?.stopPropagation()

    setAnchorEl(null)

    if (altClosingAction) {
      altClosingAction()
      return
    }

    if (otherClosingActions) {
      otherClosingActions()
    }

    setOpen(false)
  }

  return (
    <Dialog
      aria-describedby={hasError ? descriptionId : undefined}
      aria-labelledby="scroll-dialog-title"
      data-testid="dialog"
      onClose={(_event, reason) => {
        if (disableEscapeKeyDown && reason === "escapeKeyDown") return
        closeModal()
      }}
      fullScreen={isMobile}
      maxWidth={dialogMaxWidth}
      open={open}
      scroll="paper"
      sx={{
        "& .MuiDialog-container": {
          alignItems: isMobile ? "stretch" : "flex-start",
        },
        ...sx,
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 0, md: theme.spacing(1.5) },
            height: { xs: "100dvh", md: "auto" },
            display: "flex",
            flexDirection: "column",
            minWidth: fullWidth ? "calc(100% - 64px)" : "inherit",
            maxHeight: {
              xs: "none",
              md: `calc(100% - ${MODAL_EDGE_INSET_PX * 2}px)`,
            },
            mx: { xs: 0, md: theme.spacing(3) },
            width: { xs: "100%", md: undefined },
            py: horizontalPadding,
            mt: { xs: 0, md: `${MODAL_EDGE_INSET_PX}px` },
            mb: { xs: 0, md: `${MODAL_EDGE_INSET_PX}px` },
            ...(isXXS && {
              width: { xs: "100%", md: "14rem" },
              maxWidth: { xs: "100%", md: "14rem" },
            }),
            ...sxPaperProps,
          },
        },
      }}
    >
      <DialogTitle
        id="scroll-dialog-title"
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          px: horizontalPadding,
          pt: 0,
          pb: 1,
          // With nothing to show, the bar only carries the close icon and
          // the content is pulled up underneath it. Let clicks through.
          pointerEvents: hasTitleContent ? undefined : "none",
          zIndex: 2,
        }}
        variant={titleVariant}
        ref={dialogTitleRef}
      >
        {titleNode ? (
          titleNode
        ) : title || additionalTitle ? (
          <>
            <Stack
              direction={isMobile ? "column" : "row"}
              sx={{
                gap: isMobile ? 0.5 : 0,
                mr: 0.5,
              }}
            >
              {title} {additionalTitle && additionalTitle}
            </Stack>
            {topActions && <Box sx={{ ml: "auto" }}>{topActions}</Box>}
          </>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}

        {!hideCloseIcon && (
          <IconButton
            aria-label="Close dialog"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => closeModal(e)}
            sx={{
              ml: 1,
              pointerEvents: "auto",
              ...sxCloseIcon,
            }}
          >
            <IconWrapper>
              <X />
            </IconWrapper>
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent
        sx={{
          px: horizontalPadding,
          py: 0,
          mt: !(title || titleNode) ? `-${dialogTitleHeight}px` : 0,
          flex: 1,
          overflow: "auto",
          ...sxContent,
        }}
      >
        {children}
      </DialogContent>

      {!hideBottomActions && (
        <DialogActions
          sx={{
            alignItems: "center",
            px: horizontalPadding,
            pb: 0,
            pt:
              !additionalActions && !mainCtaText && !menuButtonOptions ? 0 : 2,
            ...sxActions,
          }}
        >
          {hasError && (
            <HelperText id={descriptionId} sx={{ color: red[800], mb: 0 }}>
              {errorText}
            </HelperText>
          )}

          {/*
           * Do not disable the main CTA when `hasError` is set: callers often run
           * validation on click. A disabled button cannot be clicked again.
           */}
          {additionalActions && additionalActions}

          {menuButtonOptions ? (
            <>
              <Button
                color={danger ? "error" : buttonColor}
                disabled={disabled}
                startIcon={mainCtaButtonStartIcon}
                endIcon={
                  <IconWrapper size={16}>
                    <ChevronDown />
                  </IconWrapper>
                }
                onClick={handleClick}
                size="small"
                variant="contained"
              >
                {mainCtaText}
              </Button>
              <Menu
                id="modal-main-cta-menu"
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleClose}
                slotProps={{
                  list: {
                    "aria-labelledby": "modal-main-cta-button",
                  },
                }}
              >
                {menuButtonOptions.map((option) => (
                  <MenuItem
                    dense
                    disabled={option.disabled}
                    key={option.text}
                    onClick={() => {
                      option.action()
                      handleClose()
                    }}
                  >
                    {option.node ?? (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        {option.icon}
                        <Box component="span">{option.text}</Box>
                      </Stack>
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            mainCtaText && (
              <LoadingButton
                color={danger ? "error" : buttonColor}
                disabled={disabled}
                endIcon={mainCtaButtonEndIcon}
                loading={loadingButton ?? false}
                onClick={triggerMainAction}
                startIcon={mainCtaButtonStartIcon}
              >
                {mainCtaText}
              </LoadingButton>
            )
          )}
        </DialogActions>
      )}
    </Dialog>
  )
}
