import { UserRepository } from '../domain/user';
import bcrypt from 'bcrypt';

export class ChangePasswordUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string, newPasswordRaw: string) {
    if (!newPasswordRaw || newPasswordRaw.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await bcrypt.hash(newPasswordRaw, 10);
    
    // update password
    user.password_hash = passwordHash;
    // Note: the original PrismaUserRepository didn't have an update method.
    // Let's check if it does, if not we must add it.
    await this.userRepository.update(user);

    return true;
  }
}
