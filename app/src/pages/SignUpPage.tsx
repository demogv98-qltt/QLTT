import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-bold text-gray-900">Tạo tài khoản</h1>
        <p className="mb-6 text-sm text-gray-500">
          Chưa dùng phần mềm này bao giờ? Tạo trung tâm mới, bạn sẽ là chủ trung tâm. Đã được
          mời (là giáo viên/trợ giảng/phụ huynh của một trung tâm)? Nhập mã trung tâm họ cung
          cấp thay vì tạo mới.
        </p>

        <div className="mb-4 flex rounded-md border border-gray-300 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 rounded px-2 py-1 ${mode === 'create' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
          >
            Tạo trung tâm mới
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 rounded px-2 py-1 ${mode === 'join' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
          >
            Tham gia trung tâm có sẵn
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-700">Họ tên</label>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        {mode === 'create' ? (
          <>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên trung tâm</label>
            <input
              required
              placeholder="VD: Trung tâm Vật lý Thầy Quang"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </>
        ) : (
          <>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mã trung tâm</label>
            <input
              required
              placeholder="Xin mã này từ chủ trung tâm/quản lý"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mb-3 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Đang tạo...' : 'Đăng ký'}
        </button>
        <Link to="/login" className="block text-center text-sm text-indigo-600 hover:underline">
          Đã có tài khoản? Đăng nhập
        </Link>
      </form>
    </div>
  )
}
