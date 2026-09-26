import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth, RequireRole } from './components/RequireAuth'
import { AdminPage } from './pages/AdminPage'
import { AttendancePage } from './pages/AttendancePage'
import { CentersPage } from './pages/CentersPage'
import { ClassesPage } from './pages/ClassesPage'
import { DashboardPage } from './pages/DashboardPage'
import { EnrollmentsPage } from './pages/EnrollmentsPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SignUpPage } from './pages/SignUpPage'
import { StaffPage } from './pages/StaffPage'
import { StudentsPage } from './pages/StudentsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<RequireAuth />}>
          {/* Outside Layout on purpose: Layout blocks its content when the signed-in
              account's own org is 'suspended', and the Super Admin must never be able to
              lock themselves out of the one page that can undo that. */}
          <Route path="admin" element={<AdminPage />} />
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="classes" element={<ClassesPage />} />

            <Route element={<RequireRole roles={['owner', 'manager', 'teacher', 'ta']} />}>
              <Route path="attendance" element={<AttendancePage />} />
            </Route>

            <Route element={<RequireRole roles={['owner', 'manager']} />}>
              <Route path="centers" element={<CentersPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="enrollments" element={<EnrollmentsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
