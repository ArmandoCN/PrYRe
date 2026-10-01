import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { SubmissionController } from './SubmissionController';
import { SubmitFormUseCase } from '../../../application/SubmitFormUseCase';
import { SoftDeleteSubmissionUseCase } from '../../../application/SoftDeleteSubmissionUseCase';
import { GetSubmissionsUseCase } from '../../../application/GetSubmissionsUseCase';
import { Role } from '../../../domain/user';
import { validate } from '../middlewares/validate';
import { submitSchema } from '../../../shared/validation/submission.schema';
import { requireAuth } from '../middlewares/auth';

const mockSubmitExecute = vi.fn();
const mockSoftDeleteExecute = vi.fn();
const mockGetSubmissionsExecute = vi.fn();

const mockSubmitUseCase = { execute: mockSubmitExecute } as unknown as SubmitFormUseCase;
const mockSoftDeleteUseCase = { execute: mockSoftDeleteExecute } as unknown as SoftDeleteSubmissionUseCase;
const mockGetSubmissionsUseCase = { execute: mockGetSubmissionsExecute } as unknown as GetSubmissionsUseCase;

const app = express();
app.use(express.json());
app.use(cookieParser());
const controller = new SubmissionController(mockSubmitUseCase, mockSoftDeleteUseCase, mockGetSubmissionsUseCase);

process.env.JWT_SECRET = 'test-secret';

// Optional auth for submit (guests allowed)
const optionalAuth = (req: any, res: any, next: any) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, 'test-secret') as any;
      req.user = { id: decoded.userId, role: decoded.role, email: decoded.email };
    } catch (e) {}
  }
  next();
};

app.post('/forms/:form_identifier/submissions', optionalAuth, validate(submitSchema), (req, res) => controller.submit(req, res));
app.get('/forms/:form_identifier/submissions', requireAuth([Role.ADMIN, Role.ANALYST]), (req, res) => controller.getSubmissions(req, res));
app.delete('/forms/:form_identifier/submissions/:submission_id', requireAuth([Role.ADMIN]), (req, res) => controller.softDelete(req, res));

const generateToken = (role: Role) => jwt.sign({ userId: '1', role, email: 'test@example.com' }, 'test-secret');

describe('SubmissionController E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /submissions', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).get('/forms/contact/submissions');
      expect(response.status).toBe(401);
    });

    it('should return 200 and data if ADMIN', async () => {
      mockGetSubmissionsExecute.mockResolvedValue([{ id: '1' }]);
      const token = generateToken(Role.ADMIN);
      const response = await request(app).get('/forms/contact/submissions').set('Cookie', [`token=${token}`]);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([{ id: '1' }]);
      expect(mockGetSubmissionsExecute).toHaveBeenCalledWith('contact');
    });

    it('should return 404 if form not found', async () => {
      mockGetSubmissionsExecute.mockRejectedValue(new Error('Form configuration not found'));
      const token = generateToken(Role.ANALYST);
      const response = await request(app).get('/forms/contact/submissions').set('Cookie', [`token=${token}`]);
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /submissions', () => {
    it('should return 400 if validation fails', async () => {
      const response = await request(app).post('/forms/contact/submissions').send({});
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 201 on success (guest)', async () => {
      mockSubmitExecute.mockResolvedValue({ id: 'uuid' });
      const response = await request(app).post('/forms/contact/submissions').send({ data: { a: 1 } });
      expect(response.status).toBe(201);
      expect(response.body.data.id).toBe('uuid');
    });

    it('should return 403 on password error', async () => {
      mockSubmitExecute.mockRejectedValue(new Error('Invalid or missing public password for this form'));
      const response = await request(app).post('/forms/contact/submissions').send({ data: { a: 1 }, public_password: 'wrong' });
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /submissions', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app).delete('/forms/contact/submissions/uuid');
      expect(response.status).toBe(401);
    });

    it('should return 403 if ANALYST', async () => {
      const token = generateToken(Role.ANALYST);
      const response = await request(app).delete('/forms/contact/submissions/uuid').set('Cookie', [`token=${token}`]);
      expect(response.status).toBe(403);
    });

    it('should return 200 on success for ADMIN', async () => {
      mockSoftDeleteExecute.mockResolvedValue(undefined);
      const token = generateToken(Role.ADMIN);
      const response = await request(app).delete('/forms/contact/submissions/uuid').set('Cookie', [`token=${token}`]);
      expect(response.status).toBe(200);
      expect(mockSoftDeleteExecute).toHaveBeenCalled();
    });
  });
});
