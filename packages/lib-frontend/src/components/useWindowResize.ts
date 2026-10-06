import { useCallback, useEffect, type DependencyList } from "react"

interface UseWindowResizeOptions {
  /** Whether to trigger the callback immediately on mount */
  immediate?: boolean
  /** Delay in ms to wait after resize before triggering callback (for transitions) */
  delay?: number
  /** Whether the resize listener should be active */
  enabled?: boolean
}

/**
 * Window resize listener matching digit-web `useResizeObserver`
 * (it listens to `window`, not `ResizeObserver`).
 */
export function useWindowResize(
  callback: () => void,
  dependencies: DependencyList = [],
  options: UseWindowResizeOptions = {},
): void {
  const { immediate = true, delay = 0, enabled = true } = options

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, dependencies)

  const handleResize = useCallback(() => {
    requestAnimationFrame(() => {
      if (delay > 0) {
        setTimeout(memoizedCallback, delay)
      } else {
        memoizedCallback()
      }
    })
  }, [memoizedCallback, delay])

  useEffect(() => {
    if (!enabled) return

    if (immediate) {
      handleResize()
    }

    window.addEventListener("resize", handleResize, { passive: true })
    return () => window.removeEventListener("resize", handleResize)
  }, [handleResize, immediate, enabled])
}
