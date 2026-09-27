import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Logo } from '../components/Logo'

export function ForgotPasswordPage() {
  const { resetPassword, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch {
      // error already surfaced via the store
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm shadow-slate-200/50">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo
            size="lg"
            title="QLTT TOÁN"
            subtitle="Quản lý Trung tâm Toán học"
            className="justify-center"
          />
          <h2 className="mt-3 text-base sm:text-lg font-bold text-slate-900">Quên mật khẩu</h2>
          <p className="mt-1 text-xs text-slate-500">
            Nhập email đã đăng ký, hệ thống sẽ gửi link đặt lại mật khẩu an toàn
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800 border border-emerald-200 leading-relaxed">
              Nếu email này đã đăng ký trong hệ thống, chúng tôi vừa gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả mục Thư rác/Spam).
            </div>
            <Link
              to="/login"
              className="block w-full text-center py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
            />

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs sm:text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mb-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Đang gửi email...' : 'Gửi link đặt lại mật khẩu'}
            </button>

            <div className="pt-2 text-center text-xs sm:text-sm border-t border-slate-100">
              <Link to="/login" className="text-slate-600 hover:text-indigo-600">
                Nhớ mật khẩu rồi? <span className="font-semibold text-indigo-600">Đăng nhập</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
