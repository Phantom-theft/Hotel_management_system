# Harborlight Hotel — Frontend

Full-stack hotel management UI (Phases F1–F4): public booking, customer dashboard, staff desk, and admin tools.

## Stack

React (Vite) · React Router · TanStack Query · Zustand · Tailwind CSS · Axios · Stripe Elements · Recharts

## Prerequisites

- Node.js 20+
- Backend API running at `http://localhost:3001` (see `backend/README.md`)
- Seeded demo data: `cd backend && npm run seed`

## Setup

```bash
# From repo root
cp .env.example .env
```

Configure `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | API base, default `http://localhost:3001/api` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe test publishable key |

```bash
npm install
npm run dev
```

Dev server: **http://localhost:5173** (`strictPort: true` — matches backend `CORS_ORIGIN`).

## Running against the seeded backend

1. Start Postgres + Mailhog: `cd backend && docker compose up -d`
2. Migrate + seed: `npx prisma migrate deploy && npm run seed`
3. Start API: `npm run dev` (in `backend/`)
4. Start frontend: `npm run dev` (repo root)

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| customer@demo.hotel | Customer123! | Customer |
| staff@demo.hotel | Staff123! | Staff |
| admin@demo.hotel | Admin123! | Admin |

### Seed promo codes (booking flow)

- `WELCOME10` — 10% off
- `SUMMER15` — 15% off
- `VIP20` — 20% off

## Features by route

| Route | Access | Description |
|-------|--------|-------------|
| `/rooms` | Public | Search availability |
| `/rooms/:id` | Public | Detail, reviews, calendar |
| `/book` | Auth | Guest details → review → Stripe pay |
| `/my-bookings` | Customer | Upcoming/past, cancel, leave reviews |
| `/staff` | Staff/Admin | Check-in/out, walk-ins, room board |
| `/admin/*` | Admin | Rooms, reports, team |

## Booking + payment flow

1. Search rooms → open detail → **Book this room**
2. Guest details + optional promo (live discount preview)
3. Review summary → creates **pending** booking
4. Stripe Elements → poll until **confirmed**
5. Hold expiry redirects to room search

## Email in local dev

Backend sends mail to Mailhog (`localhost:1025`). View messages at **http://localhost:8025** — no real SMTP account needed.

## Production (Vercel)

1. Set env vars in Vercel project settings (same `VITE_*` keys)
2. Point `VITE_API_BASE_URL` to your deployed API
3. Ensure API `CORS_ORIGIN` includes your Vercel URL
4. Build command: `npm run build` · Output: `dist`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
