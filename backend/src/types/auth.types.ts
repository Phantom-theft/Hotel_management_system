import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
