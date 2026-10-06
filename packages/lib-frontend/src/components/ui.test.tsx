import { useState, type ReactElement } from "react"

import { ThemeProvider, createTheme } from "@mui/material/styles"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { afterEach, describe, expect, it, vi } from "vitest"

import { InputTextField } from "./InputTextField"
import { InvisibleButton } from "./InvisibleButton"
import { Modal } from "./Modal"

const theme = createTheme()

afterEach(() => {
  cleanup()
})

function renderUi(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

describe("Modal", () => {
  it("closes on Escape unless disableEscapeKeyDown is set", async () => {
    const user = userEvent.setup()

    function Harness({
      disableEscapeKeyDown = false,
    }: {
      disableEscapeKeyDown?: boolean
    }) {
      const [open, setOpen] = useState(true)
      return (
        <Modal
          open={open}
          setOpen={setOpen}
          title="Rename"
          disableEscapeKeyDown={disableEscapeKeyDown}
        >
          Body
        </Modal>
      )
    }

    renderUi(<Harness />)
    expect(screen.getByRole("dialog", { name: "Rename" })).toBeTruthy()
    await user.keyboard("{Escape}")
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Rename" })).toBeNull()
    })

    cleanup()
    renderUi(<Harness disableEscapeKeyDown />)
    expect(screen.getByRole("dialog", { name: "Rename" })).toBeTruthy()
    await user.keyboard("{Escape}")
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByRole("dialog", { name: "Rename" })).toBeTruthy()
  })

  it("gives each dialog its own title id", () => {
    renderUi(
      <>
        <Modal open setOpen={vi.fn()} title="One">
          A
        </Modal>
        <Modal open setOpen={vi.fn()} title="Two">
          B
        </Modal>
      </>,
    )
    const dialogs = screen.getAllByRole("dialog", { hidden: true })
    const ids = dialogs.map((dialog) => dialog.getAttribute("aria-labelledby"))
    expect(ids).toHaveLength(2)
    expect(ids[0]).toBeTruthy()
    expect(ids[0]).not.toBe(ids[1])
    const titles = ids.map((id) => document.getElementById(id!)?.textContent ?? "")
    expect(titles.some((title) => title.includes("One"))).toBe(true)
    expect(titles.some((title) => title.includes("Two"))).toBe(true)
  })

  it("points the CTA menu at the button that opens it", async () => {
    const user = userEvent.setup()
    renderUi(
      <Modal
        open
        setOpen={vi.fn()}
        title="Save as"
        mainCtaText="Save"
        menuButtonOptions={[{ text: "Draft", action: vi.fn() }]}
      >
        Body
      </Modal>,
    )
    const button = screen.getByRole("button", { name: "Save" })
    expect(button.id).toBeTruthy()
    await user.click(button)
    const menu = screen.getByRole("menu")
    expect(menu.getAttribute("aria-labelledby")).toBe(button.id)
  })
})

describe("InputTextField", () => {
  it("associates the label and a nested error with the input", () => {
    function Harness() {
      const { control } = useForm({ defaultValues: { address: { city: "" } } })
      return (
        <InputTextField
          control={control}
          name="address.city"
          label="City"
          helperText="Where you ship"
          errors={{
            address: {
              city: { type: "required", message: "City is required" },
            },
          }}
        />
      )
    }

    renderUi(<Harness />)
    const input = screen.getByLabelText("City")
    expect(input.getAttribute("aria-invalid")).toBe("true")
    const errorId = input.getAttribute("aria-errormessage")
    expect(errorId).toBeTruthy()
    expect(document.getElementById(errorId!)?.textContent).toContain("City is required")
    const describedBy = input.getAttribute("aria-describedby") ?? ""
    expect(describedBy).toContain(errorId!)
    const helperId = describedBy.split(" ").find((id) => id !== errorId)
    expect(helperId).toBeTruthy()
    expect(document.getElementById(helperId!)?.textContent).toContain("Where you ship")
    expect(input.closest(".MuiInputBase-root")?.className ?? "").toContain("Mui-error")
  })
})

describe("InvisibleButton", () => {
  it("is keyboard focusable and shows a focus ring when enabled", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderUi(<InvisibleButton onClick={onClick}>Edit</InvisibleButton>)
    const button = screen.getByRole("button", { name: "Edit" })
    await user.tab()
    expect(document.activeElement).toBe(button)
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)

    const emotionClass = button.className.split(" ").find((name) => name.startsWith("css-"))
    expect(emotionClass).toBeTruthy()
    const css = [...document.querySelectorAll("style")]
      .map((style) => style.textContent ?? "")
      .join("\n")
    expect(css).toContain(`${emotionClass}:focus-visible`)
    expect(css).toMatch(
      new RegExp(`${emotionClass}:focus-visible\\{[^}]*outline:[^}]*2px solid`),
    )
  })

  it("does not take a press or click when disabled", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderUi(
      <>
        <button type="button">Before</button>
        <InvisibleButton enabled={false} onClick={onClick}>
          Edit
        </InvisibleButton>
        <button type="button">After</button>
      </>,
    )
    const button = screen.getByRole("button", { name: "Edit" })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(button.getAttribute("tabindex")).toBe("-1")
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Before" }))
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "After" }))
    button.click()
    expect(onClick).not.toHaveBeenCalled()
  })
})
