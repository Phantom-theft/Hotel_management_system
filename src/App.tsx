import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthLayout } from './components/AuthLayout'
import { AuthTransitionRoot } from './components/auth/AuthTransitionRoot'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminDashboardLayout } from './components/admin/AdminDashboardLayout'
import { AppLayout } from './components/layout/AppLayout'
import { StaffDashboardLayout } from './components/staff/StaffDashboardLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { GuestBookingDetailPage } from './pages/guest/GuestBookingDetailPage'
import { GuestBookingFlowPage } from './pages/guest/GuestBookingFlowPage'
import { GuestMyBookingsPage } from './pages/guest/GuestMyBookingsPage'
import { GuestRoomDetailPage } from './pages/guest/GuestRoomDetailPage'
import { GuestRoomsPage } from './pages/guest/GuestRoomsPage'
import { HomePage } from './pages/public/HomePage'
import { NotFoundPage } from './pages/public/NotFoundPage'
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage'
import { StaffRoomDetailPage } from './pages/staff/StaffRoomDetailPage'
import { StaffRoomsPage } from './pages/staff/StaffRoomsPage'
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage'
import { AdminRoomsPage } from './pages/admin/AdminRoomsPage'
import { AdminStaffPage } from './pages/admin/AdminStaffPage'
import { ProfilePage } from './pages/shared/ProfilePage'

function AppRoutes() {
  return (
    <AuthTransitionRoot>
      <Routes>
        {/* Standalone auth routes — panel UI rendered by AuthTransitionRoot */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Staff tooling — no site footer (must be before AppLayout catch-all) */}
        <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
          <Route element={<StaffDashboardLayout />}>
            <Route path="staff" element={<StaffDashboardPage />} />
            <Route path="staff/rooms" element={<StaffRoomsPage />} />
            <Route path="staff/rooms/:id" element={<StaffRoomDetailPage />} />
            <Route path="staff/book" element={<GuestBookingFlowPage />} />
            <Route path="staff/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminDashboardLayout />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="rooms" element={<AdminRoomsPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="promotions" element={<AdminPromotionsPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="staff" element={<AdminStaffPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>


        {/* Public customer-facing shell */}
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />

          <Route element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']} />}>
            <Route path="rooms" element={<GuestRoomsPage />} />
            <Route path="rooms/:id" element={<GuestRoomDetailPage />} />
            <Route path="book" element={<GuestBookingFlowPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="my-bookings" element={<GuestMyBookingsPage />} />
            <Route path="my-bookings/:id" element={<GuestBookingDetailPage />} />
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
