import request from 'supertest';
import { UserRole } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/database';
import { signAccessToken } from '../src/utils/jwt';
import { hashPassword } from '../src/utils/password';

jest.mock('../src/services/cloudinary.service', () => ({
  uploadImageFiles: jest.fn(async (files: Express.Multer.File[] | undefined) => {
    if (!files?.length) return [];
    return files.map((f, i) => `https://res.cloudinary.com/demo/image/upload/room-${i}-${f.originalname}`);
  }),
  uploadImageBuffer: jest.fn(),
}));

const app = createApp();

async function createUser(role: UserRole, email: string) {
  const user = await prisma.user.create({
    data: {
      name: `${role} User`,
      email,
      passwordHash: await hashPassword('password123'),
      role,
    },
  });
  const token = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}

describe('Room type image upload (multipart)', () => {
  it('accepts multipart image upload and stores Cloudinary URLs', async () => {
    const { token } = await createUser(UserRole.admin, 'upload-admin@example.com');

    const res = await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Deluxe')
      .field('basePrice', '180')
      .field('capacity', '3')
      .field('amenities', JSON.stringify(['wifi', 'tv']))
      .attach('images', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
        filename: 'room.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(res.body.roomType.name).toBe('Deluxe');
    expect(res.body.roomType.basePrice).toBe(180);
    expect(res.body.roomType.images).toEqual([
      expect.stringContaining('https://res.cloudinary.com/demo/image/upload/room-0-room.jpg'),
    ]);
  });

  it('merges pasted imageUrls with uploaded files', async () => {
    const { token } = await createUser(UserRole.admin, 'upload-merge@example.com');

    const res = await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Merged')
      .field('basePrice', '120')
      .field('capacity', '2')
      .field('imageUrls', JSON.stringify(['https://example.com/existing.jpg']))
      .attach('images', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
        filename: 'new.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(res.body.roomType.images).toEqual([
      'https://example.com/existing.jpg',
      expect.stringContaining('new.png'),
    ]);
  });

  it('still accepts JSON body with pasted image URLs (no files)', async () => {
    const { token } = await createUser(UserRole.admin, 'upload-json@example.com');

    const res = await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'UrlOnly',
        basePrice: 99,
        capacity: 2,
        images: ['https://cdn.example.com/suite.jpg'],
      })
      .expect(201);

    expect(res.body.roomType.images).toEqual(['https://cdn.example.com/suite.jpg']);
  });

  it('rejects non-image files with a clear message', async () => {
    const { token } = await createUser(UserRole.admin, 'upload-badtype@example.com');

    const res = await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Bad')
      .field('basePrice', '100')
      .field('capacity', '2')
      .attach('images', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(res.body.error).toMatch(/only image files/i);
  });

  it('rejects files larger than 5MB with a clear message', async () => {
    const { token } = await createUser(UserRole.admin, 'upload-big@example.com');
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 1);

    const res = await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'TooBig')
      .field('basePrice', '100')
      .field('capacity', '2')
      .attach('images', big, {
        filename: 'huge.jpg',
        contentType: 'image/jpeg',
      })
      .expect(400);

    expect(res.body.error).toMatch(/5mb/i);
  });

  it('keeps admin-only RBAC on multipart create', async () => {
    const customer = await createUser(UserRole.customer, 'upload-cust@example.com');

    await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${customer.token}`)
      .field('name', 'Nope')
      .field('basePrice', '50')
      .field('capacity', '1')
      .attach('images', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
        filename: 'room.jpg',
        contentType: 'image/jpeg',
      })
      .expect(403);
  });
});
