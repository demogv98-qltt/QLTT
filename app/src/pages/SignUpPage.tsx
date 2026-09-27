import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Logo } from '../components/Logo'

export function SignUpPage() {
  const { firebaseUser, signUp, error } = useAuthStore()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [orgName, setOrgName] = useState('')
  const [orgCode, setOrgCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (firebaseUser) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const org =
        mode === 'create' ? { mode: 'create' as const, orgName: orgName.trim() } : { mode: 'join' as const, orgId: orgCode.trim() }
      await signUp(email, password, displayName, org)
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
          <h2 className="mt-3 text-base sm:text-lg font-bold text-slate-900">Tạo tài khoản mới</h2>
          <p className="mt-1 text-xs text-slate-500">
            Tạo trung tâm Toán mới hoặc tham gia trung tâm có sẵn bằng mã tổ chức
          </p>
        </div>

        <div className="mb-4 flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 rounded-lg py-2 transition-all ${
              mode === 'create' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tạo trung tâm mới
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 rounded-lg py-2 transition-all ${
              mode === 'join' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tham gia có sẵn
          </button>
        </div>

        {mode === 'create' ? (
          <>
            <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Tên trung tâm</label>
            <input
              type="text"
              required
              placeholder="VD: Trung tâm Toán Thầy Việt"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
            />
            <p className="mb-4 text-[11px] text-slate-500">
              Bạn sẽ là <strong>Chủ trung tâm</strong> (toàn quyền quản trị cơ sở, học sinh, nhân sự, học phí).
            </p>
          </>
        ) : (
          <>
            <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Mã trung tâm</label>
            <input
              type="text"
              required
              placeholder="Nhập mã do trung tâm cấp"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
            />
            <p className="mb-4 text-[11px] text-slate-500">
              Chủ trung tâm lấy mã này ở thanh Menu hoặc trang Nhân sự để gửi cho bạn. Sau khi đăng ký, quản lý sẽ phân quyền (Giáo viên / Trợ giảng / Phụ huynh).
            </p>
          </>
        )}

        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Họ và tên</label>
        <input
          type="text"
          required
          placeholder="Thầy/Cô Nguyễn Văn A"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mb-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
        />

        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Email</label>
        <input
          type="email"
          required
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
        />

        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Mật khẩu</label>
        <input
          type="password"
          required
          placeholder="Tối thiểu 6 ký tự"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? 'Đang tạo...' : 'Đăng ký tài khoản'}
        </button>

        <div className="pt-2 text-center text-xs sm:text-sm border-t border-slate-100">
          <Link to="/login" className="text-slate-600 hover:text-indigo-600">
            Đã có tài khoản? <span className="font-semibold text-indigo-600">Đăng nhập</span>
          </Link>
        </div>
      </form>
    </div>
  )
}
