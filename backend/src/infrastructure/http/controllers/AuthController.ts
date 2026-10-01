import { Request, Response } from 'express';
import { AuthenticateUserUseCase } from '../../../application/AuthenticateUserUseCase';

export class AuthController {
  constructor(private authenticateUserUseCase: AuthenticateUserUseCase) {}

  async login(req: Request, res: Response) {
    try {
      const { email, password, totpCode } = req.body;

      const result = await this.authenticateUserUseCase.execute(
        email,
        password,
        totpCode
      );

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });

      return res.status(200).json({
        success: true,
        data: {
          user: result.user
        }
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials' || error.message.includes('TOTP')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  }
}
