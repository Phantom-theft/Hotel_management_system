import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AuthLayout } from './components/AuthLayout'
import { DashboardLayout } from './components/DashboardLayout'
import { AuthTransitionRoot } from './components/auth/AuthTransitionRoot'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { BookingDetailPage } from './pages/BookingDetailPage'
import { BookingFlowPage } from './pages/BookingFlowPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyBookingsPage } from './pages/MyBookingsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { RoomDetailPage } from './pages/RoomDetailPage'
import { RoomsPage } from './pages/RoomsPage'
import { StaffDashboardPage } from './pages/StaffDashboardPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminRoomsPage } from './pages/admin/AdminRoomsPage'
import { AdminStaffPage } from './pages/admin/AdminStaffPage'

function AppRoutes() {
  return (
    <AuthTransitionRoot>
      <Routes>
        {/* Standalone auth routes — panel UI rendered by AuthTransitionRoot */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Staff/admin tooling — no site footer (must be before AppLayout catch-all) */}
        <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="staff" element={<StaffDashboardPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="rooms" element={<AdminRoomsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="staff" element={<AdminStaffPage />} />
            </Route>
          </Route>
        </Route>

        {/* Public customer-facing shell */}
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />

          <Route element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']} />}>
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="rooms/:id" element={<RoomDetailPage />} />
            <Route path="book" element={<BookingFlowPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="my-bookings" element={<MyBookingsPage />} />
            <Route path="my-bookings/:id" element={<BookingDetailPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthTransitionRoot>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
