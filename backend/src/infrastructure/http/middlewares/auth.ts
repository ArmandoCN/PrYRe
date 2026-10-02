import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../../../domain/user';
import { prisma } from '../../database/prisma';

export const requireAuth = (allowedRoles?: string[], checkFormAccess: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
        has_default_password: decoded.has_default_password
      };

      const userRole = (req as any).user.role;

      if (allowedRoles && !allowedRoles.includes(userRole)) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
      }

      // Check form access if requested and user is not SUPERADMIN
      if (checkFormAccess && userRole !== 'SUPERADMIN') {
        const formIdentifier = req.params.form_identifier as string;
        if (!formIdentifier) {
          return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Form identifier is required for access check' } });
        }

        const access = await prisma.userFormAccess.findUnique({
          where: {
            user_id_form_identifier: {
              user_id: (req as any).user.id,
              form_identifier: formIdentifier
            }
          }
        });

        if (!access) {
          return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this form' } });
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
    }
  };
};
