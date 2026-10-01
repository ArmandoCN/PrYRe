import { UserRepository, Role } from '../domain/user';
import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import jwt from 'jsonwebtoken';

export class AuthenticateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(email: string, password: string, totpCode?: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (user.role === Role.ADMIN) {
      /* 
      // 2FA TEMPORALMENTE DESHABILITADO POR SOLICITUD
      if (!totpCode) {
        throw new Error('TOTP code required for ADMIN');
      }

      if (!user.totp_secret) {
        throw new Error('TOTP not configured for ADMIN');
      }

      const isTotpValid = authenticator.check(totpCode, user.totp_secret);
      if (!isTotpValid) {
        throw new Error('Invalid TOTP code');
      }
      */
    }

    const has_default_password = password === 'admin123';
    
    const secret = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email, has_default_password },
      secret,
      { expiresIn: '1h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        has_default_password
      },
    };
  }
}
