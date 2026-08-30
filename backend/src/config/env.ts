import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'strict' | 'lax' | 'none',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  /** Minutes a pending online booking holds the room before expiry */
  bookingPendingTtlMinutes: parseInt(process.env.BOOKING_PENDING_TTL_MINUTES ?? '30', 10),
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test_placeholder',
    currency: process.env.STRIPE_CURRENCY ?? 'usd',
  },
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'hotel@example.com',
  },
  hotelName: process.env.HOTEL_NAME ?? 'Hotel Management System',
};

export const REFRESH_TOKEN_COOKIE = 'refreshToken';
