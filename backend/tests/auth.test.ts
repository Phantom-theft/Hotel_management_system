import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { UserRole } from '@prisma/client';

const app = createApp();

describe('Auth — register & login', () => {
  it('registers a new customer and returns an access token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jane Guest',
        email: 'jane@example.com',
        password: 'password123',
        phone: '+1234567890',
      })
      .expect(201);

    expect(res.body.user).toMatchObject({
      name: 'Jane Guest',
      email: 'jane@example.com',
      role: 'customer',
      phone: '+1234567890',
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies![0]).toMatch(/refreshToken=/);
    expect(cookies![0]).toMatch(/HttpOnly/i);
  });

  it('rejects duplicate email on register', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane', email: 'dup@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane 2', email: 'dup@example.com', password: 'password123' })
      .expect(409);

    expect(res.body.error).toBe('Email already registered');
  });

  it('logs in with valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'John Doe', email: 'john@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'password123' })
      .expect(200);

    expect(res.body.user.email).toBe('john@example.com');
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'wrong@example.com',
        passwordHash: await hashPassword('correctpass'),
        role: UserRole.customer,
      },
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpass' })
      .expect(401);

    expect(res.body.error).toBe('Invalid email or password');
  });
});
