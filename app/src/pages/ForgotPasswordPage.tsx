import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-gray-900">Quên mật khẩu</h1>
        <p className="mb-6 text-sm text-gray-500">
          Nhập email đã đăng ký, hệ thống sẽ gửi link đặt lại mật khẩu.
        </p>

        {sent ? (
          <>
            <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              Nếu email này đã đăng ký, một email đặt lại mật khẩu vừa được gửi tới. Kiểm tra hộp
              thư (kể cả mục Spam).
            </p>
            <Link to="/login" className="block text-center text-sm text-indigo-600 hover:underline">
              Quay lại đăng nhập
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mb-3 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
            </button>
            <Link to="/login" className="block text-center text-sm text-indigo-600 hover:underline">
              Quay lại đăng nhập
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
