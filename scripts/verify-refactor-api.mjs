/**
 * Post-refactor API verification — exercises the same endpoints the split
 * guest/staff/admin frontends call. Run: node scripts/verify-refactor-api.mjs
 */
const API = process.env.API_BASE_URL ?? 'http://localhost:3001/api'

const USERS = {
  customer: { email: 'customer@demo.hotel', password: 'Customer123!' },
  staff: { email: 'staff@demo.hotel', password: 'Staff123!' },
  admin: { email: 'admin@demo.hotel', password: 'Admin123!' },
}

const results = []

function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

async function login(role) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(USERS[role]),
  })
  if (!res.ok) throw new Error(`Login ${role} failed: ${res.status}`)
  const data = await res.json()
  return { token: data.accessToken, user: data.user }
}

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function apiPost(path, token, payload) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function apiPatch(path, token, payload) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function main() {
  console.log('API verification against', API, '\n')

  // Health
  const health = await fetch(`${API}/health`)
  if (health.ok) pass('API health')
  else return fail('API health', String(health.status))

  const customer = await login('customer')
  const staff = await login('staff')
  const admin = await login('admin')
  pass('Login customer/staff/admin')

  // Unauthenticated room search should fail (rooms behind auth)
  const anonRooms = await fetch(
    `${API}/rooms?checkIn=${ymd(addDays(1))}&checkOut=${ymd(addDays(3))}&guests=2`,
  )
  if (anonRooms.status === 401) pass('Unauthenticated /rooms blocked (401)')
  else fail('Unauthenticated /rooms blocked', `got ${anonRooms.status}`)

  // Overlap: room 102 is checked_in from -2d to +1d — search today→+3d should exclude it
  const checkIn = ymd(addDays(0))
  const checkOut = ymd(addDays(3))
  const guestSearch = await apiGet(
    `/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=1`,
    customer.token,
  )
  const staffSearch = await apiGet(
    `/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=1`,
    staff.token,
  )

  if (guestSearch.status !== 200) fail('Guest room search', String(guestSearch.status))
  else pass('Guest room search', `${guestSearch.body.rooms?.length ?? 0} rooms`)

  if (staffSearch.status !== 200) fail('Staff room search', String(staffSearch.status))
  else pass('Staff room search', `${staffSearch.body.rooms?.length ?? 0} rooms`)

  const guestNums = (guestSearch.body.rooms ?? []).map((r) => r.roomNumber).sort()
  const staffNums = (staffSearch.body.rooms ?? []).map((r) => r.roomNumber).sort()
  if (JSON.stringify(guestNums) === JSON.stringify(staffNums)) {
    pass('Guest vs staff search parity', guestNums.join(', ') || 'none')
  } else {
    fail('Guest vs staff search parity', `guest=[${guestNums}] staff=[${staffNums}]`)
  }

  if (!guestNums.includes('102')) pass('Overlapping room 102 excluded from search')
  else fail('Overlapping room 102 excluded', '102 still in results')

  // Staff desk data
  const today = await apiGet('/bookings/today', staff.token)
  if (today.status === 200) {
    pass(
      "Staff today's bookings",
      `${today.body.checkIns?.length ?? 0} check-ins, ${today.body.checkOuts?.length ?? 0} check-outs`,
    )
  } else fail("Staff today's bookings", String(today.status))

  const allRooms = await apiGet('/rooms/admin/all', staff.token)
  if (allRooms.status === 200) pass('Staff room board data', `${allRooms.body.rooms?.length ?? 0} rooms`)
  else fail('Staff room board data', String(allRooms.status))

  // Walk-in on an available room
  const available = (allRooms.body.rooms ?? []).find((r) => r.status === 'available')
  if (available) {
    const walkIn = await apiPost('/bookings/walk-in', staff.token, {
      roomId: available.id,
      checkIn: ymd(addDays(10)),
      checkOut: ymd(addDays(12)),
      guestsCount: 1,
      guestName: 'Walk-in Test',
      guestEmail: 'walkin-test@demo.hotel',
    })
    if (walkIn.status === 201 && walkIn.body.booking?.status === 'confirmed') {
      pass('Walk-in booking confirmed immediately', walkIn.body.booking.id.slice(0, 8))
    } else {
      fail('Walk-in booking', `${walkIn.status} ${walkIn.body.error ?? ''}`)
    }
  } else {
    fail('Walk-in booking', 'no available room in seed data')
  }

  // Promo code (GuestPromoCodeField backend)
  const promo = await apiGet('/promo-codes/validate?code=WELCOME10', customer.token)
  if (promo.status === 200 && promo.body.valid) pass('Promo WELCOME10 valid', `${promo.body.discountPercent}%`)
  else fail('Promo validation', JSON.stringify(promo.body))

  // Check-in / check-out (staff desk actions)
  const confirmedFuture = (today.body.checkIns ?? []).find((b) => b.status === 'confirmed')
  if (confirmedFuture) {
    const ci = await apiPatch(`/bookings/${confirmedFuture.id}/check-in`, staff.token, {})
    if (ci.status === 200 && ci.body.booking?.status === 'checked_in') {
      pass('Check-in booking', confirmedFuture.id.slice(0, 8))
      const co = await apiPatch(`/bookings/${confirmedFuture.id}/check-out`, staff.token, {})
      if (co.status === 200 && co.body.booking?.status === 'checked_out') {
        pass('Check-out booking', confirmedFuture.id.slice(0, 8))
      } else fail('Check-out booking', `${co.status} ${co.body.error ?? ''}`)
    } else fail('Check-in booking', `${ci.status} ${ci.body.error ?? ''}`)
  } else {
    // Seed may not have today's confirmed check-in — create walk-in for today then check in/out
    const avail = (allRooms.body.rooms ?? []).find((r) => r.status === 'available')
    if (avail) {
      const w = await apiPost('/bookings/walk-in', staff.token, {
        roomId: avail.id,
        checkIn: ymd(addDays(0)),
        checkOut: ymd(addDays(1)),
        guestsCount: 1,
        guestName: 'Desk Test',
        guestEmail: 'desk-test@demo.hotel',
      })
      if (w.status === 201) {
        const ci = await apiPatch(`/bookings/${w.body.booking.id}/check-in`, staff.token, {})
        const co = await apiPatch(`/bookings/${w.body.booking.id}/check-out`, staff.token, {})
        if (ci.status === 200 && co.status === 200) pass('Check-in/out via walk-in today')
        else fail('Check-in/out via walk-in', `ci=${ci.status} co=${co.status}`)
      } else fail('Check-in/out setup walk-in', String(w.status))
    } else fail('Check-in/out', 'no available room')
  }

  // Review on checked_out booking (GuestReviewForm backend)
  const mine = await apiGet('/bookings/me', customer.token)
  const checkedOut = (mine.body.bookings ?? []).find((b) => b.status === 'checked_out')
  if (checkedOut?.room?.roomType?.id) {
    const review = await apiPost('/reviews', customer.token, {
      roomTypeId: checkedOut.room.roomType.id,
      rating: 5,
      comment: 'Refactor verify review',
    })
    if (review.status === 201) pass('Submit review on checked_out stay')
    else if (review.status === 409) pass('Submit review', 'already reviewed (seed)')
    else fail('Submit review', `${review.status} ${review.body.error ?? ''}`)
  } else fail('Submit review', 'no checked_out booking with room type')
  // My bookings + cancel eligible
  if (mine.status === 200) {
    pass('My bookings list', `${mine.body.bookings?.length ?? 0} bookings`)
    const cancellable = (mine.body.bookings ?? []).find(
      (b) => b.status === 'confirmed' || b.status === 'pending',
    )
    if (cancellable) {
      const cancel = await apiPatch(`/bookings/${cancellable.id}/cancel`, customer.token, {})
      if (cancel.status === 200) pass('Cancel booking', cancellable.id.slice(0, 8))
      else fail('Cancel booking', `${cancel.status} ${cancel.body.error ?? ''}`)
    } else {
      pass('Cancel booking', 'skipped — no cancellable booking in seed')
    }
  } else fail('My bookings list', String(mine.status))

  // Admin reports
  const from = ymd(addDays(-30))
  const to = ymd(addDays(0))
  for (const [label, path] of [
    ['Occupancy report', `/reports/occupancy?from=${from}&to=${to}`],
    ['Revenue report', `/reports/revenue?from=${from}&to=${to}`],
    ['Cancellations report', `/reports/cancellations?from=${from}&to=${to}`],
  ]) {
    const r = await apiGet(path, admin.token)
    if (r.status === 200) pass(label, 'data ok')
    else fail(label, String(r.status))
  }

  // Admin staff list
  const team = await apiGet('/staff', admin.token)
  if (team.status === 200) pass('Team list', `${team.body.staff?.length ?? 0} accounts`)
  else fail('Team list', String(team.status))

  // Admin room type CRUD smoke
  const newType = await apiPost('/room-types', admin.token, {
    name: `Refactor Test ${Date.now()}`,
    basePrice: 99,
    capacity: 2,
    amenities: ['WiFi'],
    description: 'verify refactor',
    images: [],
  })
  if (newType.status === 201) {
    pass('Create room type', newType.body.roomType.name)
    const typeId = newType.body.roomType.id
    const del = await fetch(`${API}/room-types/${typeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${admin.token}` },
    })
    if (del.status === 200 || del.status === 204) pass('Delete room type')
    else fail('Delete room type', String(del.status))
  } else {
    fail('Create room type', `${newType.status} ${newType.body.error ?? ''}`)
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) {
    console.log('\nFailed:')
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
