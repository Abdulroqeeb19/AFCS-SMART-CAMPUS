'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Loader2, Scan } from 'lucide-react'
import { Button } from './ui/button'
import jsQR from 'jsqr'

interface QRScannerProps {
  onScan: (text: string) => void
  onError?: (msg: string) => void
  disabled?: boolean
  resetKey?: number
}

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] })
  detect(source: ImageBitmapSource): Promise<Array<{
    rawValue: string
    format: string
    cornerPoints: Array<{ x: number; y: number }>
    boundingBox: DOMRectReadOnly
  }>>
  static getSupportedFormats(): Promise<string[]>
}

const BARCODE_FORMATS = [
  'qr_code', 'code_128', 'code_39', 'code_93', 'codabar',
  'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf',
  'data_matrix', 'pdf417', 'aztec',
] as const

const USE_NATIVE = typeof window !== 'undefined' && 'BarcodeDetector' in window
const W = 640
const H = 480
const POLL_MS = 300

export function QRScanner({ onScan, onError: _onError, disabled, resetKey }: QRScannerProps) {
  const [phase, setPhase] = useState<'idle' | 'starting' | 'active' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lockRef = useRef(false)
  const aliveRef = useRef(true)
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null)
  const onScanRef = useRef(onScan)
  useEffect(() => { onScanRef.current = onScan }, [onScan])
  const startingRef = useRef(false)

  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false; stop() }
  }, [])

  useEffect(() => {
    lockRef.current = !!disabled
  }, [disabled])

  useEffect(() => {
    if (resetKey !== undefined) {
      lockRef.current = false
      if (resetKey > 0) start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  function stop() {
    if (pollRef.current !== null) { clearInterval(pollRef.current); pollRef.current = null }
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop()
      streamRef.current = null
    }
    videoRef.current = null
    detectorRef.current = null
  }

  async function start() {
    if (!aliveRef.current || startingRef.current) return
    startingRef.current = true
    stop()
    setErrorMsg(null)
    setPhase('starting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: W }, height: { ideal: H } }
      })
      if (!aliveRef.current) { for (const t of stream.getTracks()) t.stop(); return }
      streamRef.current = stream

      const video = document.createElement('video')
      video.setAttribute('playsinline', '')
      video.setAttribute('autoplay', '')
      video.width = W; video.height = H
      video.muted = true
      video.srcObject = stream

      const root = rootRef.current
      if (root) {
        const existing = root.querySelector('video')
        if (existing) existing.remove()
        root.appendChild(video)
      }

      await video.play()
      if (!aliveRef.current) { stop(); return }
      videoRef.current = video

      if (USE_NATIVE) {
        try {
          detectorRef.current = new BarcodeDetector({ formats: [...BARCODE_FORMATS] })
        } catch {
          detectorRef.current = null
        }
      }
      {
        const c = document.createElement('canvas')
        c.width = W; c.height = H
        canvasRef.current = c
        ctxRef.current = c.getContext('2d')
      }

      setPhase('active')
      pollRef.current = setInterval(scan, POLL_MS)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setErrorMsg('Camera blocked. Click the lock icon in the address bar → Camera → Allow, then reload.')
      } else if (msg.includes('NotFoundError') || msg.includes('No camera')) {
        setErrorMsg('No camera found. Use Manual entry instead.')
      } else {
        setErrorMsg('Camera not available. Use Manual entry instead.')
      }
      setPhase('error')
    } finally {
      startingRef.current = false
    }
  }

  async function scan() {
    if (!aliveRef.current || lockRef.current || !videoRef.current) return
    if (videoRef.current.readyState < 2) return

    let text: string | null = null

    if (detectorRef.current) {
      try {
        const codes = await detectorRef.current.detect(videoRef.current)
        if (codes.length > 0) text = codes[0].rawValue
      } catch (e) { console.warn('[QR] BarcodeDetector failed:', e) }
    }

    if (!text && ctxRef.current && canvasRef.current) {
      try {
        ctxRef.current.drawImage(videoRef.current, 0, 0, W, H)
        const id = ctxRef.current.getImageData(0, 0, W, H)
        const r = jsQR(id.data, id.width, id.height)
        if (r) text = r.data
      } catch (e) { console.warn('[QR] jsQR fallback failed:', e) }
    }

    if (text && !lockRef.current && aliveRef.current) {
      if (lastScannedRef.current?.text === text && Date.now() - lastScannedRef.current.time < 3000) return
      lastScannedRef.current = { text, time: Date.now() }
      lockRef.current = true
      onScanRef.current(text)
    }
  }

  if (phase === 'error') {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
        <CameraOff className="h-8 w-8 text-red-300 mx-auto mb-2" />
        <p className="text-sm text-red-600 whitespace-pre-line">{errorMsg}</p>
        <Button onClick={start} size="sm" variant="outline" className="mt-2 gap-1.5">
          <Camera className="h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  if (phase === 'idle') {
    return (
      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-6 text-center">
        <Camera className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm text-zinc-500 mb-4">Start the camera to scan a QR or barcode.</p>
        <Button onClick={start} className="gap-2">
          <Scan className="h-4 w-4" /> Start Camera
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        ref={rootRef}
        className="relative overflow-hidden rounded-lg bg-black flex items-center justify-center"
        style={{ minHeight: 200 }}
      >
        {phase === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-10">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-white mx-auto mb-2" />
              <p className="text-xs text-zinc-300">Starting camera...</p>
            </div>
          </div>
        )}
        {phase === 'active' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-56 h-56 border-2 border-naf-gold rounded-lg opacity-60" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        {phase === 'starting' ? (
          <><Loader2 className="h-3 w-3 animate-spin" /><span>Starting camera...</span></>
        ) : (
          <><Camera className="h-3 w-3 text-emerald-500" /><span>Active &mdash; point at a QR code or barcode</span></>
        )}
      </div>
    </div>
  )
}
