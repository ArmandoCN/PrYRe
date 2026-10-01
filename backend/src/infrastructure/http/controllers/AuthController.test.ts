import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { AuthController } from './AuthController';
import { AuthenticateUserUseCase } from '../../../application/AuthenticateUserUseCase';
import { Role } from '../../../domain/user';
import { validate } from '../middlewares/validate';
import { loginSchema } from '../../../shared/validation/auth.schema';

// Mock the UseCase
const mockExecute = vi.fn();
const mockUseCase = {
  execute: mockExecute
} as unknown as AuthenticateUserUseCase;

const app = express();
app.use(express.json());
app.use(cookieParser());
const authController = new AuthController(mockUseCase);
app.post('/auth/login', validate(loginSchema), (req, res) => authController.login(req, res));

describe('AuthController E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 and set HTTP-only cookie on successful login', async () => {
    mockExecute.mockResolvedValue({
      token: 'fake-jwt-token',
      user: { id: '1', email: 'test@example.com', role: Role.ANALYST }
    });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('test@example.com');
    
    // Validate cookie
    const setCookieHeader = response.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader[0]).toMatch(/token=fake-jwt-token/);
    expect(setCookieHeader[0]).toMatch(/HttpOnly/);
  });

  it('should return 401 on invalid credentials', async () => {
    mockExecute.mockRejectedValue(new Error('Invalid credentials'));

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Invalid credentials');
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 on missing validation fields', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email' }); // Invalid email and missing password

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toBeDefined();
  });
});
