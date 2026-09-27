import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Logo } from '../components/Logo'

export function LoginPage() {
  const { firebaseUser, login, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (firebaseUser) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
    } catch {
      // error already surfaced via the store
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm shadow-slate-200/50"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo
            size="lg"
            title="QLTT TOÁN"
            subtitle="Quản lý Trung tâm Toán học"
            className="justify-center"
          />
          <p className="mt-3 text-xs sm:text-sm text-slate-500">Đăng nhập tài khoản để vào hệ thống</p>
        </div>

        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Email</label>
        <input
          type="email"
          required
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
        />

        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Mật khẩu</label>
        <input
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
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
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div className="flex flex-col gap-2 pt-2 text-center text-xs sm:text-sm border-t border-slate-100">
          <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Quên mật khẩu?
          </Link>
          <Link to="/signup" className="text-slate-600 hover:text-indigo-600">
            Chưa có tài khoản? <span className="font-semibold text-indigo-600">Đăng ký ngay</span>
          </Link>
        </div>
      </form>
    </div>
  )
}
