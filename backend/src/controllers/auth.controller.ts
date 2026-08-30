import { Request, Response, NextFunction } from 'express';
import { env, REFRESH_TOKEN_COOKIE } from '../config/env';
import * as authService from '../services/auth.service';
import { AppError } from '../utils/helpers';

function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: '/api/auth',
  });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      throw new AppError(400, 'Name, email, and password are required');
    }

    if (password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters');
    }

    const result = await authService.registerUser({ name, email, password, phone });
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    res.status(201).json({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const result = await authService.loginUser({ email, password });
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    res.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new AppError(401, 'Refresh token not provided');
    }

    const result = await authService.refreshSession(refreshToken);
    setRefreshTokenCookie(res, result.tokens.refreshToken);

    res.json({
      user: result.user,
      accessToken: result.tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    await authService.logoutUser(refreshToken);
    clearRefreshTokenCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export { setRefreshTokenCookie, clearRefreshTokenCookie };
