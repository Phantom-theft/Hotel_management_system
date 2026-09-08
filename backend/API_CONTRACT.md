# Hotel API Contract (B1-B4)

Base URL: `http://localhost:3001/api`

Auth styles:
- `Public`: no token
- `Auth`: `Authorization: Bearer <accessToken>`
- `Staff`: roles `staff|admin`
- `Admin`: role `admin`

## Auth
- `POST /auth/register` (Public)  
  Body: `{ name, email, password, phone? }`  
  201: `{ user, accessToken }` (+ httpOnly refresh cookie)
- `POST /auth/login` (Public)  
  Body: `{ email, password }`  
  200: `{ user, accessToken }` (+ httpOnly refresh cookie)
- `POST /auth/refresh` (Public with refresh cookie)  
  200: `{ user, accessToken }`
- `POST /auth/logout`  
  200: `{ message }`
- `PATCH /auth/change-password` (Auth)  
  Body: `{ currentPassword, newPassword }`  
  200: `{ message }` — rejects if current password is wrong

## Users (Auth — any role)
- `GET /users/me` → `{ user }` (name, email, phone, avatarUrl, role, createdAt, …)
- `PATCH /users/me` Body: `{ name?, phone? }` (email/role read-only)
- `POST /users/me/avatar` (multipart) field `avatar` → uploads to Cloudinary, returns `{ user }`
- `DELETE /users/me/avatar` → clears avatar, returns `{ user }`

## Room Types (Admin)
- `GET /room-types`
- `GET /room-types/:id`
- `POST /room-types` (Admin)  
  - JSON: `{ name, basePrice, capacity, amenities?, images?, description? }`  
  - multipart/form-data: fields `name`, `basePrice`, `capacity`, `amenities?` (JSON array string), `imageUrls?` (JSON URL array), `description?`, plus file field `images` (jpg/png/webp, ≤5MB each). Files are uploaded to Cloudinary; resulting URLs are stored in `RoomType.images`.
- `PATCH /room-types/:id` — same body shapes as create (partial)
- `DELETE /room-types/:id`

## Rooms
- `GET /rooms?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=1&type=<roomTypeId>` (Public availability search)
- `GET /rooms/admin/all` (Admin)
- `GET /rooms/:id` (Admin)
- `POST /rooms` (Admin) Body: `{ roomTypeId, roomNumber, floor, status? }`
- `PATCH /rooms/:id` (Admin) Body: partial above
- `DELETE /rooms/:id` (Admin)

## Bookings
- `POST /bookings` (Auth)  
  Body: `{ roomId, checkIn, checkOut, guestsCount, promoCode? }`  
  Creates `pending` booking with hold expiry.
- `GET /bookings/me` (Auth)
- `PATCH /bookings/:id/cancel` (Auth, own booking)

Staff/Admin operations:
- `GET /bookings/today`
- `POST /bookings/walk-in` Body: `{ roomId, checkIn, checkOut, guestsCount, guestName, guestEmail, guestPhone?, promoCode? }`
- `PATCH /bookings/:id/check-in`
- `PATCH /bookings/:id/check-out`
- `PATCH /bookings/:id/staff-cancel`

## Payments
- `POST /payments/create-intent` (Auth)  
  Body: `{ bookingId }`  
  201: `{ clientSecret, paymentIntentId, amount, currency }`
- `POST /payments/webhook` (Stripe)
  Handles:
  - `payment_intent.succeeded` => `Payment.paid`, booking `pending -> confirmed`
  - `payment_intent.payment_failed` => pending booking cancelled

## Reviews
- `POST /reviews` (Auth)  
  Body: `{ roomTypeId, rating(1..5), comment? }`  
  Allowed only after checked-out booking for that room type.
- `GET /roomtypes/:id/reviews?page=1&limit=10` (Public)  
  200: `{ page, limit, total, averageRating, reviews[] }`

## Promo Codes (Admin)
- `GET /promo-codes`
- `GET /promo-codes/validate?code=CODE` (Public, read-only preview — no usage increment; rate-limited 20/min/IP)  
  200: `{ valid: true, discountPercent }` or `{ valid: false }` (no usedCount/maxUses; no leaky error distinctions)
- `POST /promo-codes` Body: `{ code, discountPercent, validFrom, validTo, maxUses }`
- `PATCH /promo-codes/:id` Body: partial fields
- `DELETE /promo-codes/:id`

Promo behavior on booking creation:
- Must be active (`validFrom <= now <= validTo`)
- Must be below `maxUses`
- `usedCount` increments atomically
- Discount applies to `totalPrice`

## Reports (Admin)
- `GET /reports/occupancy?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD` (paid payments only)
- `GET /reports/cancellations?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Staff Management (Admin)
- `GET /staff`
- `POST /staff/invite` Body: `{ name, email, role: "staff"|"admin", phone? }`
- `PATCH /staff/:id/role` Body: `{ role: "customer"|"staff"|"admin" }`
- `PATCH /staff/:id/deactivate`
- `PATCH /staff/:id/reactivate`

## Validation & hardening
- Zod validation on all POST/PATCH/DELETE endpoints.
- Rate limit on `/auth/register` and `/auth/login`.
- Audit logs written for key staff/admin override actions and role/price changes.
