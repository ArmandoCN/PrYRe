import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { CustomViewController } from './CustomViewController';
import { ManageCustomViewUseCase } from '../../../application/ManageCustomViewUseCase';
import { Role } from '../../../domain/user';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { z } from 'zod';

const createCustomViewSchema = z.object({
  name: z.string(),
  form_identifier: z.string(),
  columns: z.any(),
  filters: z.any()
});

const mockExecute = vi.fn();
const mockUseCase = { execute: mockExecute } as unknown as ManageCustomViewUseCase;

const app = express();
app.use(express.json());
app.use(cookieParser());
const controller = new CustomViewController(mockUseCase);

process.env.JWT_SECRET = 'test-secret';

app.post('/custom-views', requireAuth([Role.ADMIN]), validate(createCustomViewSchema), (req, res) => controller.create(req, res));

const generateToken = (role: Role) => jwt.sign({ userId: '1', role, email: 'test@example.com' }, 'test-secret');

describe('CustomViewController E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no token', async () => {
    const response = await request(app).post('/custom-views').send({ name: 'test' });
    expect(response.status).toBe(401);
  });

  it('should return 403 if ANALYST', async () => {
    const token = generateToken(Role.ANALYST);
    const response = await request(app)
      .post('/custom-views')
      .set('Cookie', [`token=${token}`])
      .send({ name: 'test', form_identifier: 'test', columns: {}, filters: {} });
    
    expect(response.status).toBe(403);
  });

  it('should return 400 if validation fails', async () => {
    const token = generateToken(Role.ADMIN);
    const response = await request(app)
      .post('/custom-views')
      .set('Cookie', [`token=${token}`])
      .send({ name: 'test' }); // Missing required fields
    
    expect(response.status).toBe(400);
  });

  it('should return 201 on success', async () => {
    mockExecute.mockResolvedValue({ id: 'uuid', name: 'test' });
    const token = generateToken(Role.ADMIN);
    const response = await request(app)
      .post('/custom-views')
      .set('Cookie', [`token=${token}`])
      .send({ name: 'test', form_identifier: 'test', columns: {}, filters: {} });
    
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe('uuid');
  });
});
