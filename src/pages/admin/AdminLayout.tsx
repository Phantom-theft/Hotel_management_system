import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-primary text-white' : 'text-neutral-600 hover:bg-neutral-100'
  }`

export function AdminLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-primary">Admin</h1>
        <p className="mt-1 text-neutral-600">Inventory, reports, and staff accounts.</p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        <NavLink to="/admin" end className={linkClass}>
          Overview
        </NavLink>
        <NavLink to="/admin/rooms" className={linkClass}>
          Rooms
        </NavLink>
        <NavLink to="/admin/reports" className={linkClass}>
          Reports
        </NavLink>
        <NavLink to="/admin/staff" className={linkClass}>
          Staff
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
