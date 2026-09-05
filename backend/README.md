# Hotel Management System — Backend

Phases B1–B4: Auth, Rooms & Booking Engine, Payments / Notifications / Staff/Admin ops, Reviews, Promo Codes, and hardening.

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)
- Stripe test keys (optional for running without live Stripe; webhook tests use a local webhook secret)
- SMTP server for email (Mailhog via `docker compose up -d mailhog` — web UI at http://localhost:8025)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and adjust if needed
cp .env.example .env

# 3. Start PostgreSQL + Mailhog (local SMTP)
docker compose up -d

# View captured emails at http://localhost:8025 (SMTP on localhost:1025)

# 4. Apply database migrations
npx prisma migrate deploy
# (or during development: npm run prisma:migrate)

# 5. Generate Prisma client (if needed)
npm run prisma:generate

# 6. Start the API
npm run dev
```

API runs at `http://localhost:3001`. Health check: `GET /api/health`.

Seed demo data with:

```bash
npm run seed
```

Demo credentials after seed:
- `customer@demo.hotel / Customer123!`
- `staff@demo.hotel / Staff123!`
- `admin@demo.hotel / Admin123!`

## Booking payment flow (important)

1. `POST /api/bookings` creates a **`pending`** booking with `expiresAt` = now + `BOOKING_PENDING_TTL_MINUTES` (default 30).
2. `POST /api/payments/create-intent` creates a Stripe PaymentIntent for that pending booking.
3. Stripe webhook `payment_intent.succeeded` marks Payment **paid** and Booking **confirmed** (clears `expiresAt`).
4. `payment_intent.payment_failed` **cancels** the pending booking so the room is freed immediately.

**Expiry strategy:** `Booking.expiresAt` is checked in the overlap / availability query. Expired **pending** holds no longer block the room (no cron required). Tradeoff vs a cleanup job: stale pending rows may remain in the DB until cancelled/overwritten, but inventory stays correct under concurrency without depending on a scheduler.

**Walk-in exception:** `POST /api/bookings/walk-in` goes straight to **confirmed** and records a paid Payment (no Stripe). Legitimate because payment is taken at the desk offline.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm test` | Run Jest + Supertest suite |
| `npm run prisma:migrate` | Create/apply migrations (dev) |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run seed` | Seed realistic demo dataset |

## API map

### Auth
| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register` \| `/login` \| `/refresh` \| `/logout` | public / cookie |

### Rooms
| Method | Path | Access |
|--------|------|--------|
| CRUD | `/api/room-types` | admin |
| GET | `/api/rooms?checkIn=&checkOut=&guests=&type=` | public |
| CRUD | `/api/rooms` (+ `/admin/all`) | admin |

### Bookings & payments
| Method | Path | Access |
|--------|------|--------|
| POST | `/api/bookings` | authenticated → **pending** |
| GET | `/api/bookings/me` | authenticated |
| PATCH | `/api/bookings/:id/cancel` | authenticated |
| POST | `/api/payments/create-intent` | authenticated |
| POST | `/api/payments/webhook` | Stripe signature |
| GET | `/api/bookings/today` | staff/admin |
| POST | `/api/bookings/walk-in` | staff/admin → **confirmed** |
| PATCH | `/api/bookings/:id/check-in` \| `/check-out` | staff/admin |

### Admin
| Method | Path | Access |
|--------|------|--------|
| CRUD | `/api/room-types` | admin — create/update accept JSON **or** `multipart/form-data` (`images` files → Cloudinary; `imageUrls` for pasted URLs) |
| CRUD | `/api/rooms` | admin |
| GET | `/api/reports/occupancy` \| `/revenue` \| `/cancellations` | admin |
| CRUD | `/api/promo-codes` | admin |
| POST | `/api/staff/invite` | admin |
| PATCH | `/api/staff/:id/role` \| `/deactivate` | admin |

### Reviews
| Method | Path | Access |
|--------|------|--------|
| POST | `/api/reviews` | authenticated |
| GET | `/api/roomtypes/:id/reviews?page=&limit=` | public |

Overlap rule: `existingCheckIn < newCheckOut AND existingCheckOut > newCheckIn`, ignoring cancelled and **expired pending** bookings.  
Revenue reports use **paid Payment** rows only.

## Environment notes

| Variable | Local default | Notes |
|----------|---------------|-------|
| `COOKIE_SECURE` | `false` | `true` only behind HTTPS |
| `COOKIE_SAME_SITE` | `lax` | |
| `CORS_ORIGIN` | `http://localhost:5173` | not `*` with credentials |
| `BOOKING_PENDING_TTL_MINUTES` | `30` | pending hold lifetime |
| `STRIPE_*` | placeholders | set real test keys for live Stripe |
| `SMTP_*` | localhost:1025 | Mailhog-friendly |
| `CLOUDINARY_URL` | — | Preferred: `cloudinary://api_key:api_secret@cloud_name` for room-type image uploads |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | — | Alternative to `CLOUDINARY_URL` |

Copy `.env.example` → `.env`. Never commit `.env`.

Full request/response contract is in `API_CONTRACT.md`.
