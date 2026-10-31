import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Storage } from './storage';
import { AuthUser, UserRecord, UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'saarthi_gov_jwt_secret_key_2026_secured';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tokenPayload?: TokenPayload;
    }
  }
}

export function generateToken(user: Pick<UserRecord, 'id' | 'email' | 'role'>): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Optional Authentication:
 * Checks Authorization Bearer header.
 * If valid, loads real user from server-side Storage and attaches to req.user.
 * If missing or invalid, leaves req.user undefined.
 * Explicitly ignores and cleanses any client-supplied x-saarthi-role.
 */
export function authenticateOptional(req: Request, res: Response, next: NextFunction): void {
  // Strip client-controlled role header to prevent any spoofing
  if (req.headers['x-saarthi-role']) {
    delete req.headers['x-saarthi-role'];
  }

  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return next();
  }

  // Load user from trusted server-side storage
  const user = Storage.getUserById(payload.userId);
  if (user) {
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role, // Always server-authoritative!
      designation: user.designation,
      department: user.department,
    };
    req.tokenPayload = payload;
  }
  next();
}

/**
 * Required Authentication:
 * Requires valid Authorization Bearer header.
 * Returns 401 if missing, expired, or invalid.
 */
export function authenticateRequired(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-saarthi-role']) {
    delete req.headers['x-saarthi-role'];
  }

  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_TOKEN_MISSING',
      message: 'Authentication token is required. Please sign in.',
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'AUTH_TOKEN_INVALID',
      message: 'Invalid or expired authentication session. Please sign in again.',
    });
    return;
  }

  const user = Storage.getUserById(payload.userId);
  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'USER_NOT_FOUND',
      message: 'Authenticated user account no longer exists.',
    });
    return;
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role, // Always server-authoritative
    designation: user.designation,
    department: user.department,
  };
  req.tokenPayload = payload;
  next();
}

/**
 * Require specific roles:
 * Must be preceded by authenticateRequired or validates req.user
 * Returns 401 if unauthenticated, 403 if authenticated but lacking role.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED',
        message: 'Authentication is required to access this resource.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Access denied. Role '${req.user.role}' lacks authorization. Required role(s): ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}

export function requireReviewerOrAdmin(req: Request, res: Response, next: NextFunction): void {
  authenticateRequired(req, res, (err?: any) => {
    if (err) return next(err);
    requireRole('reviewer', 'admin')(req, res, next);
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  authenticateRequired(req, res, (err?: any) => {
    if (err) return next(err);
    requireRole('admin')(req, res, next);
  });
}

