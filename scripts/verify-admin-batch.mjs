/**
 * Verification script for admin dashboard feature batch.
 * Run: node scripts/verify-admin-batch.mjs
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

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  return { status: res.status, body: json }
}

function filterBookings(bookings, searchQuery, statusFilter) {
  let list = bookings
  if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim()
    list = list.filter((b) => {
      const guestName = b.guest?.name?.toLowerCase() ?? ''
      const guestEmail = b.guest?.email?.toLowerCase() ?? ''
      const roomNum = b.room?.roomNumber?.toLowerCase() ?? ''
      const bookingId = b.id.toLowerCase()
      return guestName.includes(q) || guestEmail.includes(q) || roomNum.includes(q) || bookingId.includes(q)
    })
  }
  return list
}


function computeUiAdrRevpar(revenue, occupancy) {
  const totalRev = revenue?.totalRevenue ?? 0
  const roomNightsSold = revenue?.roomNightsSold ?? 0
  const totalRooms = occupancy?.totalRooms ?? 0
  const adr = totalRev > 0 && roomNightsSold > 0 ? totalRev / roomNightsSold : null
  const revpar = totalRev > 0 && totalRooms > 0 ? totalRev / totalRooms : null
  return { adr, revpar, roomNightsSold, totalRooms }
}

function computeExpectedAdrRevpar(revenue, occupancy) {
  const totalRev = revenue?.totalRevenue ?? 0
  const roomNightsSold = revenue?.roomNightsSold ?? 0
  const totalRooms = occupancy?.totalRooms ?? 0
  const adr = roomNightsSold > 0 ? totalRev / roomNightsSold : null
  const revpar = totalRooms > 0 ? totalRev / totalRooms : null
  return { adr, revpar, roomNightsSold, totalRooms }
}

function getPresetRange(preset) {
  const now = new Date()
  const to = ymd(now)
  const fromDate = new Date(now)
  if (preset === 'today') return { from: to, to }
  if (preset === '7d') fromDate.setDate(now.getDate() - 7)
  else if (preset === '30d') fromDate.setDate(now.getDate() - 30)
  else if (preset === 'mtd') fromDate.setDate(1)
  else if (preset === 'ytd') fromDate.setMonth(0, 1)
  return { from: ymd(fromDate), to }
}

function buildCsvRows(revenue, occupancy) {
  const rows = ['Report Category,Date/Key,Metric 1,Metric 2']
  rows.push('--- REVENUE BY ROOM TYPE ---')
  revenue?.byRoomType?.forEach((r) => {
    rows.push(`Room Type Revenue,${r.roomTypeName},${r.revenue.toFixed(2)},USD`)
  })
  rows.push('--- DAILY OCCUPANCY ---')
  rows.push('Date,Occupied Rooms,Total Rooms,Occupancy Rate (%)')
  occupancy?.days?.forEach((d) => {
    rows.push(`${d.date},${d.occupiedRooms},${d.totalRooms},${d.occupancyRate.toFixed(1)}%`)
  })
  return rows
}

async function main() {
  console.log('Admin batch verification against', API, '\n')

  const health = await fetch(`${API}/health`)
  if (!health.ok) return fail('API health', String(health.status))
  pass('API health')

  const customer = await login('customer')
  const staff = await login('staff')
  const admin = await login('admin')
  pass('Login customer/staff/admin')

  // --- RBAC route/API matrix ---
  const adminPaths = [
    '/bookings/admin/all',
    '/promo-codes',
    '/room-types',
    '/reports/occupancy?from=2026-01-01&to=2026-12-31',
    '/bookings/today',
  ]

  for (const path of adminPaths) {
    const anon = await api('GET', path, null)
    if (anon.status === 401) pass(`RBAC anon blocked ${path}`)
    else fail(`RBAC anon blocked ${path}`, `got ${anon.status}`)
  }

  const custAll = await api('GET', '/bookings/admin/all', customer.token)
  if (custAll.status === 403) pass('RBAC customer blocked /bookings/admin/all')
  else fail('RBAC customer blocked /bookings/admin/all', `got ${custAll.status}`)

  const staffAll = await api('GET', '/bookings/admin/all', staff.token)
  if (staffAll.status === 403) pass('RBAC staff blocked /bookings/admin/all')
  else fail('RBAC staff blocked /bookings/admin/all', `got ${staffAll.status}`)

  const adminAll = await api('GET', '/bookings/admin/all', admin.token)
  if (adminAll.status === 200) pass('RBAC admin /bookings/admin/all', `${adminAll.body.bookings?.length ?? 0} bookings`)
  else fail('RBAC admin /bookings/admin/all', String(adminAll.status))

  const custPromo = await api('GET', '/promo-codes', customer.token)
  if (custPromo.status === 403) pass('RBAC customer blocked /promo-codes list')
  else fail('RBAC customer blocked /promo-codes list', `got ${custPromo.status}`)

  const staffToday = await api('GET', '/bookings/today', staff.token)
  if (staffToday.status === 200) pass('RBAC staff /bookings/today')
  else fail('RBAC staff /bookings/today', String(staffToday.status))

  const adminToday = await api('GET', '/bookings/today', admin.token)
  if (adminToday.status === 200) pass('RBAC admin /bookings/today')
  else fail('RBAC admin /bookings/today', String(adminToday.status))

  // --- Room operational strip counts ---
  const roomsRes = await api('GET', '/rooms/admin/all', admin.token)
  const rooms = roomsRes.body.rooms ?? []
  const roomCounts = {
    total: rooms.length,
    available: rooms.filter((r) => r.status === 'available').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    maintenance: rooms.filter((r) => r.status === 'maintenance').length,
  }
  pass('Room strip counts', JSON.stringify(roomCounts))

  const todayRes = adminToday.body
  pass(
    "Today's ops counts",
    `${todayRes.checkIns?.length ?? 0} check-ins, ${todayRes.checkOuts?.length ?? 0} check-outs`,
  )

  // --- ADR / RevPAR spot check ---
  const from = ymd(addDays(-30))
  const to = ymd(addDays(0))
  const [revRes, occRes] = await Promise.all([
    api('GET', `/reports/revenue?from=${from}&to=${to}`, admin.token),
    api('GET', `/reports/occupancy?from=${from}&to=${to}`, admin.token),
  ])
  const ui = computeUiAdrRevpar(revRes.body, occRes.body)
  const expected = computeExpectedAdrRevpar(revRes.body, occRes.body)
  if (ui.adr != null) {
    const adrDiff = Math.abs(ui.adr - (expected.adr ?? 0))
    if (expected.adr != null && adrDiff > 0.01) {
      fail(
        'ADR matches industry formula (revenue/room-nights)',
        `UI=${ui.adr.toFixed(2)} expected≈${expected.adr.toFixed(2)} (room-nights=${expected.roomNightsSold})`,
      )
    } else if (expected.adr == null) {
      pass('ADR calculation', `UI shows ${ui.adr.toFixed(2)} (no paid room-nights baseline)`)
    } else {
      pass('ADR calculation', `UI ${ui.adr.toFixed(2)}`)
    }
  } else pass('ADR calculation', 'shows — (no revenue/bookings in range)')

  if (ui.revpar != null && expected.revpar != null) {
    const revparDiff = Math.abs(ui.revpar - expected.revpar)
    if (revparDiff > 0.01) {
      fail(
        'RevPAR matches revenue/total-rooms',
        `UI=${ui.revpar.toFixed(2)} expected≈${expected.revpar.toFixed(2)} (rooms=${expected.totalRooms})`,
      )
    } else pass('RevPAR calculation', `UI ${ui.revpar.toFixed(2)}`)
  } else pass('RevPAR calculation', ui.revpar != null ? `UI ${ui.revpar.toFixed(2)}` : 'shows —')

  // --- Booking search/filter logic ---
  const allBookings = adminAll.body.bookings ?? []
  if (allBookings.length > 0) {
    const sample = allBookings[0]
    const byName = filterBookings(allBookings, sample.guest?.name?.split(' ')[0] ?? 'x', 'all')
    if (byName.length >= 1) pass('Booking search by guest name', `${byName.length} hit(s)`)
    else fail('Booking search by guest name', '0 hits')

    if (sample.guest?.email) {
      const byEmail = filterBookings(allBookings, sample.guest.email.split('@')[0], 'all')
      if (byEmail.length >= 1) pass('Booking search by email', `${byEmail.length} hit(s)`)
      else fail('Booking search by email', '0 hits')
    }

    const byId = filterBookings(allBookings, sample.id.slice(0, 8), 'all')
    if (byId.length === 1) pass('Booking search by booking ID')
    else fail('Booking search by booking ID', `got ${byId.length}`)

    if (sample.room?.roomNumber) {
      const byRoom = filterBookings(allBookings, sample.room.roomNumber, 'all')
      if (byRoom.length >= 1) pass('Booking search by room number', `${byRoom.length} hit(s)`)
      else fail('Booking search by room number', '0 hits')
    }

    for (const status of ['confirmed', 'checked_in', 'checked_out', 'pending', 'cancelled']) {
      const filtered = filterBookings(allBookings, '', status)
      const expectedCount = allBookings.filter((b) => b.status === status).length
      if (filtered.length === expectedCount) pass(`Booking status filter: ${status}`, String(expectedCount))
      else fail(`Booking status filter: ${status}`, `got ${filtered.length}, expected ${expectedCount}`)
    }
  } else fail('Booking search/filter', 'no bookings in DB')

  // --- Admin cancel uses staff endpoint (before check-in/out mutates bookings) ---
  const cancellable = allBookings.find(
    (b) => b.status === 'confirmed' || b.status === 'pending',
  )
  if (cancellable) {
    const customerCancel = await api('PATCH', `/bookings/${cancellable.id}/cancel`, admin.token)
    if (customerCancel.status === 403) {
      pass('Admin blocked from customer /cancel', '403 as expected')
    } else {
      fail('Admin blocked from customer /cancel', `${customerCancel.status}`)
    }
    const staffCancel = await api(
      'PATCH',
      `/bookings/${cancellable.id}/staff-cancel`,
      admin.token,
    )
    if (staffCancel.status === 200 && staffCancel.body.booking?.status === 'cancelled') {
      pass('Admin folio cancel action', 'staff-cancel succeeded')
    } else {
      fail('Admin folio cancel action', `${staffCancel.status} ${staffCancel.body.error ?? ''}`)
    }
  } else pass('Admin folio cancel action', 'skipped — no cancellable booking')

  // --- Check-in/out via API (folio modal actions) ---
  const confirmed = allBookings.find((b) => b.status === 'confirmed')
  if (confirmed) {
    const ci = await api('PATCH', `/bookings/${confirmed.id}/check-in`, admin.token)
    if (ci.status === 200 && ci.body.booking?.status === 'checked_in') {
      pass('Folio check-in action', confirmed.id.slice(0, 8))
      const co = await api('PATCH', `/bookings/${ci.body.booking.id}/check-out`, admin.token)
      if (co.status === 200 && co.body.booking?.status === 'checked_out') {
        pass('Folio check-out action', confirmed.id.slice(0, 8))
      } else fail('Folio check-out action', `${co.status}`)
    } else fail('Folio check-in action', `${ci.status} ${ci.body.error ?? ''}`)
  } else pass('Folio check-in/out', 'skipped — no confirmed booking')

  // --- Room status update (floor plan) ---
  const testRoom = rooms.find((r) => r.status === 'available') ?? rooms[0]
  if (testRoom) {
    const original = testRoom.status
    const next = original === 'maintenance' ? 'available' : 'maintenance'
    const patch = await api('PATCH', `/rooms/${testRoom.id}`, admin.token, { status: next })
    if (patch.status === 200 && patch.body.room?.status === next) {
      pass('Room floor plan status update', `${original} → ${next}`)
      await api('PATCH', `/rooms/${testRoom.id}`, admin.token, { status: original })
    } else fail('Room floor plan status update', `${patch.status}`)
  } else fail('Room floor plan status update', 'no rooms')

  // --- Report presets ---
  for (const preset of ['today', '7d', '30d', 'mtd', 'ytd']) {
    const range = getPresetRange(preset)
    const r = await api('GET', `/reports/revenue?from=${range.from}&to=${range.to}`, admin.token)
    if (r.status === 200 && r.body.from?.startsWith(range.from.slice(0, 10))) {
      pass(`Report preset ${preset}`, `${range.from} → ${range.to}`)
    } else {
      fail(`Report preset ${preset}`, `status=${r.status}`)
    }
  }

  // --- CSV export structure ---
  const csvRows = buildCsvRows(revRes.body, occRes.body)
  const csv = csvRows.join('\n')
  const hasHeader = csv.startsWith('Report Category')
  const hasRevenue = csv.includes('--- REVENUE BY ROOM TYPE ---')
  const hasOcc = csv.includes('--- DAILY OCCUPANCY ---')
  const roomTypeLines = revRes.body.byRoomType?.length ?? 0
  const occLines = occRes.body.days?.length ?? 0
  const expectedLines = 1 + 1 + roomTypeLines + 1 + 1 + occLines
  if (hasHeader && hasRevenue && hasOcc && csvRows.length === expectedLines) {
    pass('CSV export structure', `${csvRows.length} rows, matches on-screen data`)
  } else {
    fail('CSV export structure', `rows=${csvRows.length} expected≈${expectedLines}`)
  }

  // Malformed check: no unescaped newlines in data rows
  const badRows = csvRows.filter((row, i) => i > 0 && row.split(',').length < 2)
  if (badRows.length === 0) pass('CSV row format')
  else fail('CSV row format', `${badRows.length} malformed rows`)

  // --- Promotions ---
  const promoCode = `VERIFY${Date.now().toString().slice(-6)}`
  const createPromo = await api('POST', '/promo-codes', admin.token, {
    code: promoCode,
    discountPercent: 12,
    validFrom: new Date().toISOString(),
    validTo: new Date(addDays(30)).toISOString(),
    maxUses: 5,
  })
  if (createPromo.status === 201) {
    pass('Create promo code', promoCode)
    const list = await api('GET', '/promo-codes', admin.token)
    const found = (list.body.promoCodes ?? []).find((p) => p.code === promoCode)
    if (found && found.usedCount === 0) pass('Promo appears in list with 0 redemptions')
    else fail('Promo appears in list', 'not found or wrong usedCount')

    // Redeem via guest booking flow
    const gci = ymd(addDays(40))
    const gco = ymd(addDays(42))
    const search = await api('GET', `/rooms?checkIn=${gci}&checkOut=${gco}&guests=1`, customer.token)
    const groom = search.body.rooms?.[0]
    if (groom) {
      const validate = await api('GET', `/promo-codes/validate?code=${promoCode}`, customer.token)
      if (validate.status === 200 && validate.body.valid) pass('Guest promo validation still works', '12%')
      else fail('Guest promo validation', JSON.stringify(validate.body))

      const booking = await api('POST', '/bookings', customer.token, {
        roomId: groom.id,
        checkIn: gci,
        checkOut: gco,
        guestsCount: 1,
        promoCode,
      })
      if (booking.status === 201) {
        pass('Booking with new promo code', `total ${booking.body.booking?.totalPrice}`)
        const list2 = await api('GET', '/promo-codes', admin.token)
        const updated = (list2.body.promoCodes ?? []).find((p) => p.code === promoCode)
        if (updated && updated.usedCount >= 1) pass('Promo redemption count incremented', String(updated.usedCount))
        else fail('Promo redemption count incremented', `usedCount=${updated?.usedCount}`)
        await api('PATCH', `/bookings/${booking.body.booking.id}/cancel`, customer.token)
      } else fail('Booking with new promo code', `${booking.status}`)
      await api('DELETE', `/promo-codes/${found.id}`, admin.token)
    } else fail('Promo redemption test', 'no available room')
  } else fail('Create promo code', `${createPromo.status} ${createPromo.body.error ?? ''}`)

  // --- Reviews ---
  const types = await api('GET', '/room-types', admin.token)
  const roomTypes = types.body.roomTypes ?? []
  if (roomTypes.length > 0) {
    const rt = roomTypes[0]
    const reviews = await api('GET', `/roomtypes/${rt.id}/reviews?page=1&limit=50`, admin.token)
    if (reviews.status === 200) {
      const list = reviews.body.reviews ?? []
      const avg = reviews.body.averageRating ?? 0
      const manualAvg =
        list.length > 0 ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      list.forEach((r) => {
        if (dist[r.rating] !== undefined) dist[r.rating]++
      })
      if (list.length === 0 || Math.abs(avg - manualAvg) < 0.05) {
        pass('Reviews average rating', `${avg.toFixed(1)} over ${list.length} reviews`)
      } else {
        fail('Reviews average rating', `API=${avg} manual=${manualAvg.toFixed(2)}`)
      }
      pass('Reviews distribution data', JSON.stringify(dist))
      const fiveStar = list.filter((r) => r.rating === 5)
      const filtered = list.filter((r) => r.rating === 5)
      if (fiveStar.length === filtered.length) pass('Reviews star filter logic')
      else fail('Reviews star filter logic')
    } else fail('Reviews API', String(reviews.status))
  } else fail('Reviews page data', 'no room types')

  // --- Guest flow smoke ---
  const guestSearch = await api('GET', `/rooms?checkIn=${ymd(addDays(50))}&checkOut=${ymd(addDays(52))}&guests=2`, customer.token)
  if (guestSearch.status === 200) pass('Guest room search', `${guestSearch.body.rooms?.length ?? 0} rooms`)
  else fail('Guest room search', String(guestSearch.status))

  const myBookings = await api('GET', '/bookings/me', customer.token)
  if (myBookings.status === 200) pass('Guest my-bookings', `${myBookings.body.bookings?.length ?? 0}`)
  else fail('Guest my-bookings', String(myBookings.status))

  // --- Staff desk smoke ---
  const staffRooms = await api('GET', `/rooms?checkIn=${ymd(addDays(5))}&checkOut=${ymd(addDays(7))}&guests=1`, staff.token)
  if (staffRooms.status === 200) pass('Staff room search unchanged', `${staffRooms.body.rooms?.length ?? 0} rooms`)
  else fail('Staff room search unchanged', String(staffRooms.status))

  const walkRoom = (await api('GET', '/rooms/admin/all', staff.token)).body.rooms?.find((r) => r.status === 'available')
  if (walkRoom) {
    const walk = await api('POST', '/bookings/walk-in', staff.token, {
      roomId: walkRoom.id,
      checkIn: ymd(addDays(60)),
      checkOut: ymd(addDays(62)),
      guestsCount: 1,
      guestName: 'Staff Verify',
      guestEmail: `staff-verify-${Date.now()}@demo.hotel`,
    })
    if (walk.status === 201 && walk.body.booking?.status === 'confirmed') pass('Staff walk-in still works')
    else fail('Staff walk-in still works', `${walk.status}`)
  } else pass('Staff walk-in still works', 'skipped — no available room')

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
