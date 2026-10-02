import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoftDeleteSubmissionUseCase } from './SoftDeleteSubmissionUseCase';
import { SubmissionRepository } from '../domain/submission';
import { Role, User } from '../domain/user';

describe('SoftDeleteSubmissionUseCase', () => {
  let submissionRepository: SubmissionRepository;
  let useCase: SoftDeleteSubmissionUseCase;
  let adminUser: User;
  let analystUser: User;

  beforeEach(() => {
    submissionRepository = {
      save: vi.fn(),
      softDelete: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
    };
    useCase = new SoftDeleteSubmissionUseCase(submissionRepository);

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
    await expect(useCase.execute(analystUser, 'contact', 'uuid'))
      .rejects.toThrow('Forbidden: Only ADMIN can perform soft deletes');
  });

  it('should successfully soft delete if user is ADMIN', async () => {
    vi.mocked(submissionRepository.softDelete).mockResolvedValue(undefined);

    await useCase.execute(adminUser, 'contact', 'uuid');

    expect(submissionRepository.softDelete).toHaveBeenCalledWith('contact', 'uuid');
  });
});
