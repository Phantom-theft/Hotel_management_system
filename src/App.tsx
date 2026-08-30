import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AuthLayout } from './components/AuthLayout'
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

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Standalone full-viewport auth pages without header or footer */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Main application layout with header and footer */}
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="rooms"
              element={
                <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
                  <RoomsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="rooms/:id"
              element={
                <ProtectedRoute allowedRoles={['customer', 'staff', 'admin']}>
                  <RoomDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="book"
              element={
                <ProtectedRoute allowedRoles={['customer', 'admin', 'staff']}>
                  <BookingFlowPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-bookings"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-bookings/:id"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <BookingDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff"
              element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <StaffDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="rooms" element={<AdminRoomsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="staff" element={<AdminStaffPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
