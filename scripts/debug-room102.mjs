const API = 'http://localhost:3001/api'
const ymd = (d) => d.toISOString().slice(0, 10)
const add = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

const customerLogin = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'customer@demo.hotel', password: 'Customer123!' }),
})
const { accessToken } = await customerLogin.json()

const staffLogin = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'staff@demo.hotel', password: 'Staff123!' }),
})
const { accessToken: staffToken } = await staffLogin.json()
const checkIn = ymd(add(0))
const checkOut = ymd(add(3))
const search = await (
  await fetch(`${API}/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
).json()
const all = await (
  await fetch(`${API}/rooms/admin/all`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  })
).json()
const bookings = await (
  await fetch(`${API}/bookings/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
).json()
console.log('all keys', Object.keys(all))
console.log('bookings count', bookings.bookings?.length)
const b102 = bookings.bookings?.find((b) => b.room?.roomNumber === '102')
console.log(JSON.stringify({ checkIn, checkOut, r102InSearch: search.rooms.some((r) => r.roomNumber === '102'), r102Status: r102?.status, booking102: b102 ? { status: b102.status, checkIn: b102.checkIn, checkOut: b102.checkOut } : null }, null, 2))
