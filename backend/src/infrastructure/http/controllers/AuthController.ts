import { Request, Response } from 'express';
import { AuthenticateUserUseCase } from '../../../application/AuthenticateUserUseCase';
import { ChangePasswordUseCase } from '../../../application/ChangePasswordUseCase';

export class AuthController {
  constructor(
    private authenticateUserUseCase: AuthenticateUserUseCase,
    private changePasswordUseCase: ChangePasswordUseCase
  ) {}

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

  async getMe(req: Request, res: Response) {
    // req.user is set by auth middleware
    return res.status(200).json({
      success: true,
      data: {
        user: (req as any).user
      }
    });
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { new_password } = req.body;
      const user = (req as any).user;
      
      await this.changePasswordUseCase.execute(user.id, new_password);

      // We clear the token so they have to log in again with the new password
      res.clearCookie('token');

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: error.message
        }
      });
    }
  }
}
