import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadAssetUseCase } from './UploadAssetUseCase';
import { AssetRepository, FileStorageService } from '../domain/asset';
import { Role, User } from '../domain/user';

describe('UploadAssetUseCase', () => {
  let assetRepository: AssetRepository;
  let fileStorageService: FileStorageService;
  let useCase: UploadAssetUseCase;

  beforeEach(() => {
    assetRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      softDelete: vi.fn(),
    };
    fileStorageService = {
      saveFile: vi.fn(),
      deleteFile: vi.fn(),
      getFile: vi.fn(),
    };
    useCase = new UploadAssetUseCase(assetRepository, fileStorageService);
  });

  it('should throw an error for unsupported MIME types', async () => {
    const buffer = Buffer.from('test');
    await expect(useCase.execute(buffer, 'test.exe', 'application/x-msdownload', 100))
      .rejects.toThrow('Unsupported file type');
  });

  it('should throw an error if file size exceeds 5MB', async () => {
    const buffer = Buffer.from('test');
    await expect(useCase.execute(buffer, 'test.jpg', 'image/jpeg', 6 * 1024 * 1024))
      .rejects.toThrow('File size exceeds the 5MB limit');
  });

  it('should save file to storage and asset metadata to repository', async () => {
    const buffer = Buffer.from('test');
    const result = await useCase.execute(buffer, 'test.jpg', 'image/jpeg', 100);

    expect(result.original_name).toBe('test.jpg');
    expect(result.mime_type).toBe('image/jpeg');
    expect(result.size_bytes).toBe(100);
    expect(result.id).toBeDefined();

    expect(fileStorageService.saveFile).toHaveBeenCalledWith(result.id, buffer);
    expect(assetRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: result.id,
      original_name: 'test.jpg',
      mime_type: 'image/jpeg'
    }));
  });

  it('should correctly attribute uploaded_by if user is provided', async () => {
    const user: User = { id: 'user123', email: 'test@example.com', password_hash: '', totp_secret: null, role: Role.ADMIN, created_at: new Date(), updated_at: new Date(), deleted_at: null };
    const buffer = Buffer.from('test');
    
    const result = await useCase.execute(buffer, 'test.png', 'image/png', 200, user);
    
    expect(result.uploaded_by).toBe('user123');
    expect(assetRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      uploaded_by: 'user123'
    }));
  });
});
