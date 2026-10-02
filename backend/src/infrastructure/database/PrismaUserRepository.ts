import { UserRepository, User, Role } from '../../domain/user';

export class PrismaUserRepository implements UserRepository {
  constructor(private prismaClient: any) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prismaClient.user.findFirst({
      where: { email, deleted_at: null }
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

  async findById(id: string): Promise<User | null> {
    const user = await this.prismaClient.user.findUnique({
      where: { id }
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

  async update(user: User): Promise<User> {
    const updated = await this.prismaClient.user.update({
      where: { id: user.id },
      data: {
        password_hash: user.password_hash,
        totp_secret: user.totp_secret,
        role: user.role,
        email: user.email,
      }
    });

    return {
      id: updated.id,
      email: updated.email,
      password_hash: updated.password_hash,
      totp_secret: updated.totp_secret,
      role: updated.role as Role,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      deleted_at: updated.deleted_at
    };
  }
}
