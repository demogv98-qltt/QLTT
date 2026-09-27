import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Logo } from './Logo'
import { studentAvatar } from '../lib/avatar'
import { Printer, X, QrCode } from 'lucide-react'
import type { Student } from '../types'

interface StudentCardModalProps {
  student: Student | null
  centerName?: string
  orgName?: string
  onClose: () => void
}

export function StudentCardModal({ student, centerName, orgName, onClose }: StudentCardModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    if (!student) return
    QRCode.toDataURL(student.id, {
      width: 280,
      margin: 1,
      color: {
        dark: '#1e1b4b', // deep indigo
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [student])

  if (!student) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="print:hidden absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="print:hidden mb-4 text-center">
          <h3 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-indigo-600" />
            Thẻ học sinh điện tử
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dùng để điểm danh tự động bằng máy quét hoặc camera
          </p>
        </div>

        {/* ================= Printable Student Badge ================= */}
        <div
          id="student-badge"
          className="overflow-hidden rounded-2xl border-2 border-indigo-500/20 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 p-6 shadow-md"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4">
            <Logo size="sm" title={orgName || 'HỌC TOÁN CÙNG TLM'} subtitle="Trung tâm Toán học" />
            {centerName && (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {centerName}
              </span>
            )}
          </div>

          {/* Student Info */}
          <div className="text-center my-3">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-3xl mb-2">
              {studentAvatar(student.id)}
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight">{student.fullName}</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Phụ huynh: {student.parentPhone || student.phone || 'Chưa cập nhật'}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center bg-white rounded-xl p-3 border border-indigo-100 shadow-2xs my-3">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code ${student.fullName}`} className="h-36 w-36 object-contain" />
            ) : (
              <div className="h-36 w-36 flex items-center justify-center text-xs text-slate-400">
                Đang tạo mã...
              </div>
            )}
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-1">
              Quét mã này để điểm danh
            </p>
            <p className="font-mono text-[9px] text-slate-400 mt-0.5 select-all">
              ID: {student.id.slice(0, 12)}
            </p>
          </div>

          {/* Card Footer */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">Hệ thống Quản lý Đào tạo Toán học TLM</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="print:hidden mt-6 flex gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            In thẻ học sinh
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
