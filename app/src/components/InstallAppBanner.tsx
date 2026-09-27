import { useEffect, useState } from 'react'
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('qltt_install_dismissed') === 'true'
  })

  useEffect(() => {
    // Check if running as standalone PWA
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    setIsStandalone(isStandaloneMode)

    // Check if on iOS device
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Listen for Android / Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  if (isStandalone || dismissed) {
    return null
  }

  // Only show if either Android install prompt is ready, OR on iOS device
  if (!deferredPrompt && !isIOS) {
    return null
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else if (isIOS) {
      setShowIOSModal(true)
    }
  }

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem('qltt_install_dismissed', 'true')
  }

  return (
    <>
      {/* Top Banner on Mobile */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 px-4 py-2.5 text-white shadow-md">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              <Smartphone className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold truncate">
                Cài ứng dụng "Học Toán Cùng TLM" vào điện thoại
              </p>
              <p className="text-[11px] text-indigo-100 hidden sm:block truncate">
                Mở nhanh từ màn hình chính, không cần gõ link web, chạy mượt toàn màn hình
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-indigo-700 hover:bg-indigo-50 shadow-xs transition-transform active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Cài vào màn hình</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              title="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Step-by-Step Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Cài đặt trên iPhone / iPad
                  </h3>
                  <p className="text-xs text-slate-500">Chỉ mất 5 giây với trình duyệt Safari</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 pt-2 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Bấm nút Chia sẻ (Share)</p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                    Tìm biểu tượng <Share className="h-3.5 w-3.5 text-blue-600 inline" /> ở thanh công cụ dưới đáy Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Chọn "Thêm vào MH chính"</p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                    Cuộn xuống danh sách tác vụ và bấm <PlusSquare className="h-3.5 w-3.5 text-slate-700 inline" /> <strong>Thêm vào MH chính</strong> (Add to Home Screen).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900">Bấm "Thêm" ở góc trên bên phải</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Icon Logo trung tâm sẽ lập tức xuất hiện ngay ngoài màn hình chính của bạn như một ứng dụng tải từ App Store!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full rounded-2xl bg-indigo-600 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
