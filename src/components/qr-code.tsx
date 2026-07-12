'use client'

import { useEffect, useRef, useState } from 'react'

interface QRCodeProps {
  id: string
  label?: string
}

export function QRCode({ id, label }: QRCodeProps) {
  const [svg, setSvg] = useState('')
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setLoading(true)
    import('qrcode').then((QRCode) => {
      if (!mounted.current) return
      QRCode.default.toString(id, { type: 'svg', margin: 1, width: 200 }).then((s: string) => {
        if (mounted.current) {
          setSvg(s)
          setLoading(false)
        }
      })
    })
    return () => { mounted.current = false }
  }, [id])

  if (loading) {
    return <div className="w-48 h-48 mx-auto bg-zinc-100 rounded-lg animate-pulse" />
  }

  return (
    <div className="text-center">
      <div className="bg-white p-3 rounded-lg border border-zinc-200 inline-block" dangerouslySetInnerHTML={{ __html: svg }} />
      {label && <p className="mt-2 text-sm font-medium text-zinc-700">{label}</p>}
      <p className="text-xs text-zinc-400 font-mono">{id}</p>
    </div>
  )
}

export function QRButton({ id, name, title }: { id: string; name: string; title: string }) {
  const [open, setOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="5" height="5" />
          <rect x="16" y="3" width="5" height="5" />
          <rect x="3" y="16" width="5" height="5" />
          <path d="M21 16h-3v-3" /><path d="M3 11h3v3" /><path d="M11 3h2v5" />
          <path d="M11 16h2v5" /><path d="M16 11h5" /><path d="M11 11h2" />
        </svg>
        QR
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div ref={printRef}>
              <QRCode id={id} label={name} />
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  const el = printRef.current
                  if (el) {
                    const w = window.open('')
                    if (w) {
                      w.document.write(`<html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh">`)
                      w.document.write(el.innerHTML)
                      w.document.write(`</body></html>`)
                      w.document.close()
                      w.print()
                    }
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
