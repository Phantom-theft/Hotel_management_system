import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { UserRole } from '@prisma/client';
import { signAccessToken } from '../src/utils/jwt';

const app = createApp();

describe('RBAC middleware', () => {
  it('blocks customer role from admin-only route', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Customer User',
        email: 'customer@example.com',
        passwordHash: await hashPassword('password123'),
        role: UserRole.customer,
      },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    expect(res.body.error).toBe('Insufficient permissions');
  });

  it('allows admin role to access admin-only route', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: await hashPassword('password123'),
        role: UserRole.admin,
      },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.message).toBe('Admin dashboard');
  });

  it('blocks unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/dashboard').expect(401);

    expect(res.body.error).toBe('Authentication required');
  });
});
