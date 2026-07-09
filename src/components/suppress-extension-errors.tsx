'use client'

import { useEffect } from 'react'

export function SuppressExtensionErrors() {
  useEffect(() => {
    // ── Suppress console.error for known extension/noise errors ──
    const originalConsoleError = console.error
    console.error = (...args: unknown[]) => {
      const allMsgs = args.map((a) => String(a ?? '')).join(' ')
      if (
        allMsgs.includes('A tree hydrated but some attributes') ||
        allMsgs.includes('bis_skin_checked') ||
        allMsgs.includes('Cannot redefine property') ||
        allMsgs.includes('play()') ||
        allMsgs.includes('AbortError') ||
        allMsgs.includes('removeChild') ||
        allMsgs.includes('video surface') ||
        allMsgs.includes('NotFoundError')
      ) {
        return
      }
      for (const arg of args) {
        if (arg instanceof DOMException) return
      }
      originalConsoleError.apply(console, args)
    }

    // ── Suppress unhandled promise rejections for video/camera errors ──
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (
        reason instanceof DOMException ||
        (reason instanceof Error && reason.name === 'AbortError') ||
        (typeof reason === 'object' &&
          reason !== null &&
          (reason.name === 'AbortError' ||
            (typeof reason.message === 'string' && reason.message.includes('play()'))))
      ) {
        event.preventDefault()
      }
    }

    // ── Suppress window error events for known extension/video errors ──
    const onWindowError = (event: ErrorEvent) => {
      const msg = typeof event.message === 'string' ? event.message : ''
      if (
        event.error instanceof DOMException ||
        msg.includes('play()') ||
        msg.includes('removeChild') ||
        msg.includes('video surface') ||
        msg.includes('ethereum') ||
        msg.includes('bis_skin_checked') ||
        msg.includes('AbortError') ||
        msg.includes('NotFoundError')
      ) {
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('error', onWindowError)

    return () => {
      console.error = originalConsoleError
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('error', onWindowError)
    }
  }, [])

  return null
}
