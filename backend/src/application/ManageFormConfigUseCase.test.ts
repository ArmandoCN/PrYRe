import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageFormConfigUseCase } from './ManageFormConfigUseCase';
import { FormConfigRepository } from '../domain/formConfig';
import { Role, User } from '../domain/user';

describe('ManageFormConfigUseCase', () => {
  let repository: FormConfigRepository;
  let useCase: ManageFormConfigUseCase;
  let adminUser: User;
  let analystUser: User;

  beforeEach(() => {
    repository = {
      findByIdentifier: vi.fn(),
      save: vi.fn(),
    };
    useCase = new ManageFormConfigUseCase(repository);

    adminUser = {
      id: '1',
      email: 'admin@test.com',
      password_hash: 'hash',
      totp_secret: null,
      role: Role.ADMIN,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    analystUser = { ...adminUser, id: '2', role: Role.ANALYST };
  });

  it('should throw an error if user is not an ADMIN', async () => {
    await expect(useCase.execute(analystUser, 'contact_form', { is_active: true }))
      .rejects.toThrow('Forbidden: Only ADMIN can manage form configurations');
  });

  it('should throw an error if form config is not found', async () => {
    vi.mocked(repository.findByIdentifier).mockResolvedValue(null);
    
    await expect(useCase.execute(adminUser, 'unknown_form', { is_active: true }))
      .rejects.toThrow('Form configuration not found');
  });

  it('should update is_active and public_password successfully', async () => {
    const existingConfig = {
      id: '1',
      form_identifier: 'contact_form',
      is_active: false,
      public_password: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    vi.mocked(repository.findByIdentifier).mockResolvedValue(existingConfig);

    const result = await useCase.execute(adminUser, 'contact_form', { is_active: true, public_password: 'new_password' });

    expect(result.is_active).toBe(true);
    expect(result.public_password).toBe('new_password');
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      is_active: true,
      public_password: 'new_password'
    }));
  });
});
