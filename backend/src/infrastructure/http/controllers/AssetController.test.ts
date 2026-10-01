import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import multer from 'multer';
import { AssetController } from './AssetController';
import { UploadAssetUseCase } from '../../../application/UploadAssetUseCase';

const mockExecute = vi.fn();
const mockUseCase = { execute: mockExecute } as unknown as UploadAssetUseCase;

const app = express();
const upload = multer();
const controller = new AssetController(mockUseCase);

app.post('/assets', upload.single('file'), (req, res) => controller.upload(req, res));

describe('AssetController E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if no file provided', async () => {
    const response = await request(app).post('/assets');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 415 if unsupported media type', async () => {
    mockExecute.mockRejectedValue(new Error('Unsupported file type'));
    const response = await request(app)
      .post('/assets')
      .attach('file', Buffer.from('test'), { filename: 'test.exe', contentType: 'application/x-msdownload' });
    expect(response.status).toBe(415);
  });

  it('should return 413 if payload too large', async () => {
    mockExecute.mockRejectedValue(new Error('File size exceeds the 5MB limit'));
    const response = await request(app)
      .post('/assets')
      .attach('file', Buffer.from('test'), { filename: 'test.jpg', contentType: 'image/jpeg' });
    expect(response.status).toBe(413);
  });

  it('should return 201 on success', async () => {
    mockExecute.mockResolvedValue({ id: 'uuid', original_name: 'test.jpg' });
    const response = await request(app)
      .post('/assets')
      .attach('file', Buffer.from('test'), { filename: 'test.jpg', contentType: 'image/jpeg' });
    
    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe('uuid');
  });
});
