import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../../domain/user';

export const requireAuth = (allowedRoles?: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    try {
      const secret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(token, secret) as any;

      (req as any).user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      if (allowedRoles && !allowedRoles.includes((req as any).user.role)) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    }
  };
};
