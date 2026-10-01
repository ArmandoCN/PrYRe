export enum Role {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  totp_secret: string | null;
  role: Role;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<User>;
}
