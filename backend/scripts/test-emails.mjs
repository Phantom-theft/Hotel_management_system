/**
 * Smoke-test booking emails via Mailhog.
 * Requires: docker compose up -d mailhog, backend running on :3001
 */
const API = 'http://localhost:3001/api';
const MAILHOG = 'http://localhost:8025/api/v2/messages';

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

async function mailCount() {
  const res = await fetch(`${MAILHOG}?limit=1`);
  if (!res.ok) throw new Error(`Mailhog unreachable: ${res.status}`);
  const data = await res.json();
  return data.total;
}

async function main() {
  const before = await mailCount();
  console.log('Mailhog messages before:', before);

  const customer = await login('customer@demo.hotel', 'Customer123!');
  const staff = await login('staff@demo.hotel', 'Staff123!');

  // Cancellation email — cancel a confirmed booking
  const bookingsRes = await fetch(`${API}/bookings/me`, {
    headers: { Authorization: `Bearer ${customer.accessToken}` },
  });
  const { bookings } = await bookingsRes.json();
  const toCancel = bookings.find((b) => b.status === 'confirmed');
  if (!toCancel) {
    console.warn('No confirmed booking to cancel — skipping cancellation test');
  } else {
    const cancelRes = await fetch(`${API}/bookings/${toCancel.id}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customer.accessToken}` },
    });
    console.log('Cancel booking:', cancelRes.status, cancelRes.ok ? 'OK' : await cancelRes.text());
  }

  // Confirmation email — staff walk-in
  const roomsRes = await fetch(`${API}/rooms/admin/all`, {
    headers: { Authorization: `Bearer ${staff.accessToken}` },
  });
  const { rooms } = await roomsRes.json();
  const room = rooms.find((r) => r.status === 'available');
  if (!room) {
    console.warn('No available room for walk-in');
  } else {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const checkIn = d.toISOString().slice(0, 10);
    d.setDate(d.getDate() + 2);
    const checkOut = d.toISOString().slice(0, 10);
    const walkRes = await fetch(`${API}/bookings/walk-in`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${staff.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId: room.id,
        checkIn,
        checkOut,
        guestsCount: 1,
        guestName: 'Email Test Guest',
        guestEmail: 'email-test@demo.hotel',
        guestPhone: '+10000000999',
      }),
    });
    console.log('Walk-in booking:', walkRes.status, walkRes.ok ? 'OK' : await walkRes.text());
  }

  await new Promise((r) => setTimeout(r, 1500));
  const after = await mailCount();
  console.log('Mailhog messages after:', after);
  console.log('New messages:', after - before);

  const list = await fetch(`${MAILHOG}?limit=5`);
  const msgs = await list.json();
  for (const item of msgs.items ?? []) {
    console.log(' -', item.Content?.Headers?.Subject?.[0] ?? '(no subject)', '→', item.To?.[0]?.Mailbox);
  }

  if (after <= before) {
    console.error('FAIL: No new emails in Mailhog');
    process.exit(1);
  }
  console.log('PASS: Emails captured in Mailhog');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
