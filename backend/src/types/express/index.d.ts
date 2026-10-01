import { Role } from '../../domain/user';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}
