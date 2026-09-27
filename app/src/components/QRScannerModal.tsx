import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { playSuccessBeep } from '../lib/sound'
import { Camera, CheckCircle2, AlertTriangle, X, Keyboard } from 'lucide-react'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (scannedText: string) => Promise<{ success: boolean; message: string; studentName?: string }>
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; studentName?: string } | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [submittingManual, setSubmittingManual] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isCooldownRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return

    const qrElementId = 'qr-camera-stream'
    const html5QrCode = new Html5Qrcode(qrElementId)
    scannerRef.current = html5QrCode

    setCameraError(null)

    const config = {
      fps: 10,
      qrbox: { width: 220, height: 220 },
      aspectRatio: 1.0,
    }

    html5QrCode
      .start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          if (isCooldownRef.current) return
          isCooldownRef.current = true

          try {
            playSuccessBeep()
            const result = await onScan(decodedText.trim())
            setScanResult(result)
          } catch {
            setScanResult({ success: false, message: 'Lỗi xử lý điểm danh' })
          } finally {
            // 2s cooldown before next scan
            setTimeout(() => {
              isCooldownRef.current = false
            }, 2000)
          }
        },
        () => {
          // ignore frame errors while seeking
        },
      )
      .then(() => setCameraActive(true))
      .catch((err) => {
        setCameraActive(false)
        setCameraError(
          err instanceof Error
            ? 'Không thể truy cập camera. Vui lòng cấp quyền truy cập camera trên trình duyệt hoặc nhập mã thủ công.'
            : 'Lỗi kết nối camera.',
        )
      })

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {})
      }
    }
  }, [isOpen, onScan])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    setSubmittingManual(true)
    try {
      playSuccessBeep()
      const result = await onScan(manualCode.trim())
      setScanResult(result)
      setManualCode('')
    } finally {
      setSubmittingManual(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2">
            <Camera className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Quét mã QR điểm danh</h3>
          <p className="text-xs text-slate-500">Giơ thẻ học sinh hoặc mã QR trước camera</p>
        </div>

        {/* Feedback Alert Banner */}
        {scanResult && (
          <div
            className={`mb-4 flex items-center gap-2.5 rounded-2xl p-3.5 text-xs sm:text-sm font-semibold transition-all animate-bounce ${
              scanResult.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {scanResult.success ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div className="min-w-0 flex-1">
              {scanResult.studentName && (
                <p className="font-bold text-slate-900">{scanResult.studentName}</p>
              )}
              <p className="leading-tight">{scanResult.message}</p>
            </div>
          </div>
        )}

        {/* Camera Video Container */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-950 aspect-square max-h-[260px] mx-auto flex items-center justify-center">
          <div id="qr-camera-stream" className="w-full h-full object-cover" />

          {/* Scanner Overlay Sight */}
          {cameraActive && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-44 w-44 rounded-2xl border-2 border-emerald-400/80 shadow-lg shadow-emerald-500/20">
                <span className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-emerald-400" />
                <span className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-emerald-400" />
                <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/90 text-center text-slate-300">
              <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
              <p className="text-xs">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual Barcode / ID Input Option */}
        <form onSubmit={handleManualSubmit} className="mt-4 pt-3 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5 text-slate-400" />
            Hoặc quét bằng máy đọc mã vạch / nhập mã:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập ID học sinh..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm font-mono focus:border-indigo-600 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={submittingManual || !manualCode.trim()}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Ghi nhận
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Đóng camera
          </button>
        </div>
      </div>
    </div>
  )
}
