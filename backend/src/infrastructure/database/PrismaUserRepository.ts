import { UserRepository, User, Role } from '../../domain/user';

export class PrismaUserRepository implements UserRepository {
  constructor(private prismaClient: any) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prismaClient.user.findUnique({
      where: { email }
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      totp_secret: user.totp_secret,
      role: user.role as Role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deleted_at: user.deleted_at
    };
  }
}
