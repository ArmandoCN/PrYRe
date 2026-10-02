import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { FormConfigController } from './FormConfigController';
import { ManageFormConfigUseCase } from '../../../application/ManageFormConfigUseCase';
import { Role } from '../../../domain/user';
import { validate } from '../middlewares/validate';
import { updateFormConfigSchema } from '../../../shared/validation/formConfig.schema';
import { requireAuth } from '../middlewares/auth';

const mockExecute = vi.fn();
const mockUseCase = {
  execute: mockExecute
} as unknown as ManageFormConfigUseCase;

const app = express();
app.use(express.json());
app.use(cookieParser());
const controller = new FormConfigController(mockUseCase);

process.env.JWT_SECRET = 'test-secret';

app.patch('/forms/:form_identifier/config', 
  requireAuth([Role.ADMIN]), 
  validate(updateFormConfigSchema), 
  (req, res) => controller.updateConfig(req, res)
);

const generateToken = (role: Role) => {
  return jwt.sign({ userId: '1', role, email: 'test@example.com' }, 'test-secret');
};

describe('FormConfigController E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no token provided', async () => {
    const response = await request(app)
      .patch('/forms/contact/config')
      .send({ is_active: true });

    expect(response.status).toBe(401);
  });

  it('should return 403 if user is not ADMIN', async () => {
    const token = generateToken(Role.ANALYST);
    const response = await request(app)
      .patch('/forms/contact/config')
      .set('Cookie', [`token=${token}`])
      .send({ is_active: true });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('should return 400 if validation fails', async () => {
    const token = generateToken(Role.ADMIN);
    const response = await request(app)
      .patch('/forms/contact/config')
      .set('Cookie', [`token=${token}`])
      .send({}); // Neither is_active nor public_password

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 200 on success', async () => {
    mockExecute.mockResolvedValue({
      id: '1',
      form_identifier: 'contact',
      is_active: true,
      public_password: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null
    });

    const token = generateToken(Role.ADMIN);
    const response = await request(app)
      .patch('/forms/contact/config')
      .set('Cookie', [`token=${token}`])
      .send({ is_active: true });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.is_active).toBe(true);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({ role: Role.ADMIN }), 
      'contact', 
      { is_active: true }
    );
  });
});
