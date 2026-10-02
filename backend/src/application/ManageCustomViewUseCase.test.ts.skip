import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageCustomViewUseCase } from './ManageCustomViewUseCase';
import { CustomViewRepository } from '../domain/customView';
import { Role, User } from '../domain/user';

describe('ManageCustomViewUseCase', () => {
  let repository: CustomViewRepository;
  let useCase: ManageCustomViewUseCase;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByFormIdentifier: vi.fn(),
      softDelete: vi.fn(),
    };
    useCase = new ManageCustomViewUseCase(repository);
  });

  const adminUser: User = { id: '1', email: '', password_hash: '', totp_secret: null, role: Role.ADMIN, created_at: new Date(), updated_at: new Date(), deleted_at: null };
  const analystUser: User = { ...adminUser, role: Role.ANALYST };

  it('should throw forbidden if user is not ADMIN', async () => {
    await expect(useCase.execute(analystUser, { name: 'test', form_identifier: 'test', columns: {}, filters: {} }))
      .rejects.toThrow('Forbidden: Only ADMIN can manage custom views');
  });

  it('should create and save a new custom view', async () => {
    const result = await useCase.execute(adminUser, { name: 'test', form_identifier: 'test', columns: { a: 1 }, filters: { b: 2 } });
    
    expect(result.id).toBeDefined();
    expect(result.name).toBe('test');
    expect(result.columns.a).toBe(1);
    expect(repository.save).toHaveBeenCalled();
  });
});
