import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { AuthenticateUserUseCase } from './AuthenticateUserUseCase';
import { Role, UserRepository } from '../domain/user';
import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

describe('AuthenticateUserUseCase', () => {
  let userRepository: UserRepository;
  let useCase: AuthenticateUserUseCase;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
    };
    useCase = new AuthenticateUserUseCase(userRepository);
  });

  it('should throw an error if user is not found', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(useCase.execute('test@example.com', 'password123')).rejects.toThrow('Invalid credentials');
  });

  it('should authenticate an ANALYST with valid credentials (no TOTP required)', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: '1',
      email: 'analyst@example.com',
      password_hash: passwordHash,
      totp_secret: null,
      role: Role.ANALYST,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    const result = await useCase.execute('analyst@example.com', 'password123');
    expect(result).toHaveProperty('token');
    expect(result.user).toMatchObject({ email: 'analyst@example.com', role: Role.ANALYST });
  });

  it('should throw an error if password is incorrect', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: '1',
      email: 'analyst@example.com',
      password_hash: passwordHash,
      totp_secret: null,
      role: Role.ANALYST,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    await expect(useCase.execute('analyst@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
  });

  it('should throw an error if ADMIN provides no TOTP code', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      password_hash: passwordHash,
      totp_secret: 'some-secret',
      role: Role.ADMIN,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    await expect(useCase.execute('admin@example.com', 'password123')).rejects.toThrow('TOTP code required for ADMIN');
  });

  it('should throw an error if ADMIN provides invalid TOTP code', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      password_hash: passwordHash,
      totp_secret: 'some-secret',
      role: Role.ADMIN,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    await expect(useCase.execute('admin@example.com', 'password123', '000000')).rejects.toThrow('Invalid TOTP code');
  });

  it('should authenticate an ADMIN with valid credentials and correct TOTP code', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const secret = authenticator.generateSecret();
    const token = authenticator.generate(secret);

    vi.mocked(userRepository.findByEmail).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      password_hash: passwordHash,
      totp_secret: secret,
      role: Role.ADMIN,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    });

    const result = await useCase.execute('admin@example.com', 'password123', token);
    expect(result).toHaveProperty('token');
    expect(result.user).toMatchObject({ email: 'admin@example.com', role: Role.ADMIN });
  });
});
