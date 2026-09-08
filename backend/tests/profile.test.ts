import request from 'supertest';
import { UserRole } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { signAccessToken } from '../src/utils/jwt';

const app = createApp();

async function createUser(role: UserRole, email: string, password = 'password123') {
  const user = await prisma.user.create({
    data: {
      name: `${role} User`,
      email,
      passwordHash: await hashPassword(password),
      phone: '555-0100',
      role,
    },
  });
  const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token, password };
}

describe('Profile — GET/PATCH /users/me', () => {
  it('returns the authenticated user profile for any role', async () => {
    const { token, user } = await createUser(UserRole.customer, 'profile-cust@example.com');

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user).toMatchObject({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: '555-0100',
      role: UserRole.customer,
      avatarUrl: null,
    });
    expect(res.body.user.createdAt).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects non-image avatar uploads', async () => {
    const { token } = await createUser(UserRole.customer, 'avatar-bad@example.com');

    const res = await request(app)
      .post('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(res.body.error).toMatch(/only image files/i);
  });

  it('clears avatar with DELETE /users/me/avatar', async () => {
    const { token, user } = await createUser(UserRole.staff, 'avatar-clear@example.com');
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: 'https://cdn.example.com/a.jpg' },
    });

    const res = await request(app)
      .delete('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.user.avatarUrl).toBeNull();
  });

  it('updates name and phone without changing email or role', async () => {
    const { token, user } = await createUser(UserRole.staff, 'profile-staff@example.com');

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Staff', phone: '555-9999' })
      .expect(200);

    expect(res.body.user.name).toBe('Updated Staff');
    expect(res.body.user.phone).toBe('555-9999');
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.role).toBe(UserRole.staff);
  });

  it('requires authentication', async () => {
    await request(app).get('/api/users/me').expect(401);
    await request(app).patch('/api/users/me').send({ name: 'X' }).expect(401);
  });
});

describe('Profile — PATCH /auth/change-password', () => {
  it('rejects wrong current password', async () => {
    const { token } = await createUser(UserRole.admin, 'pwd-admin@example.com');

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'NewPass123!' })
      .expect(400);

    expect(res.body.error).toMatch(/current password/i);
  });

  it('changes password and allows login with the new one', async () => {
    const email = 'pwd-ok@example.com';
    const { token, password } = await createUser(UserRole.customer, email, 'OldPass123!');

    await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'BrandNew123!' })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'OldPass123!' })
      .expect(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'BrandNew123!' })
      .expect(200);

    expect(login.body.accessToken).toBeTruthy();
  });

  it('rejects short new passwords', async () => {
    const { token, password } = await createUser(UserRole.staff, 'pwd-short@example.com');

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'short' })
      .expect(400);

    expect(res.body.error).toMatch(/at least 8/i);
  });
});
