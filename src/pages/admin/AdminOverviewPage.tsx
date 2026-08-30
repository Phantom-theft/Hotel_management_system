import { Link } from 'react-router-dom'

export function AdminOverviewPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        {
          to: '/admin/rooms',
          title: 'Room inventory',
          body: 'Manage room types and individual rooms.',
        },
        {
          to: '/admin/reports',
          title: 'Reports',
          body: 'Occupancy, paid revenue, and cancellations.',
        },
        {
          to: '/admin/staff',
          title: 'Staff accounts',
          body: 'Invite, change roles, and deactivate users.',
        },
      ].map((card) => (
        <Link
          key={card.to}
          to={card.to}
          className="rounded-xl border border-neutral-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <h2 className="font-display text-xl text-primary">{card.title}</h2>
          <p className="mt-2 text-sm text-neutral-600">{card.body}</p>
        </Link>
      ))}
    </div>
  )
}
