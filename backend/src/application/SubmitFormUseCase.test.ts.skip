import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitFormUseCase } from './SubmitFormUseCase';
import { FormConfigRepository } from '../domain/formConfig';
import { SubmissionRepository } from '../domain/submission';
import { Role, User } from '../domain/user';

describe('SubmitFormUseCase', () => {
  let formConfigRepository: FormConfigRepository;
  let submissionRepository: SubmissionRepository;
  let useCase: SubmitFormUseCase;

  beforeEach(() => {
    formConfigRepository = {
      findByIdentifier: vi.fn(),
      save: vi.fn(),
    };
    submissionRepository = {
      save: vi.fn(),
      softDelete: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
    };
    useCase = new SubmitFormUseCase(formConfigRepository, submissionRepository);
  });

  it('should throw error if form configuration does not exist', async () => {
    vi.mocked(formConfigRepository.findByIdentifier).mockResolvedValue(null);
    
    await expect(useCase.execute('contact', {}, undefined))
      .rejects.toThrow('Form configuration not found');
  });

  it('should throw error if form is inactive', async () => {
    vi.mocked(formConfigRepository.findByIdentifier).mockResolvedValue({
      id: '1', form_identifier: 'contact', is_active: false, public_password: null, created_at: new Date(), updated_at: new Date(), deleted_at: null
    });
    
    await expect(useCase.execute('contact', {}, undefined))
      .rejects.toThrow('This form is currently inactive');
  });

  it('should throw error if guest tries to submit without providing required public password', async () => {
    vi.mocked(formConfigRepository.findByIdentifier).mockResolvedValue({
      id: '1', form_identifier: 'contact', is_active: true, public_password: 'secretpassword', created_at: new Date(), updated_at: new Date(), deleted_at: null
    });
    
    // Guest User (undefined user)
    await expect(useCase.execute('contact', {}, undefined, 'wrongpassword'))
      .rejects.toThrow('Invalid or missing public password for this form');
  });

  it('should allow guest submission if form is active and password matches', async () => {
    vi.mocked(formConfigRepository.findByIdentifier).mockResolvedValue({
      id: '1', form_identifier: 'contact', is_active: true, public_password: 'secretpassword', created_at: new Date(), updated_at: new Date(), deleted_at: null
    });
    
    const mockSavedSubmission = { id: 'uuid', created_at: new Date(), updated_at: new Date(), deleted_at: null, data: 'test' };
    vi.mocked(submissionRepository.save).mockResolvedValue(mockSavedSubmission);
    
    const result = await useCase.execute('contact', { data: 'test' }, undefined, 'secretpassword');
    expect(result).toBe(mockSavedSubmission);
    expect(submissionRepository.save).toHaveBeenCalledWith('contact', { data: 'test' });
  });

  it('should bypass public password check if user is authenticated (ADMIN/ANALYST)', async () => {
    vi.mocked(formConfigRepository.findByIdentifier).mockResolvedValue({
      id: '1', form_identifier: 'contact', is_active: true, public_password: 'secretpassword', created_at: new Date(), updated_at: new Date(), deleted_at: null
    });
    
    const authUser: User = { id: '2', email: 'test@example.com', password_hash: '', totp_secret: null, role: Role.ANALYST, created_at: new Date(), updated_at: new Date(), deleted_at: null };
    
    const mockSavedSubmission = { id: 'uuid', created_at: new Date(), updated_at: new Date(), deleted_at: null, data: 'test' };
    vi.mocked(submissionRepository.save).mockResolvedValue(mockSavedSubmission);
    
    const result = await useCase.execute('contact', { data: 'test' }, authUser);
    expect(result).toBe(mockSavedSubmission);
    expect(submissionRepository.save).toHaveBeenCalledWith('contact', { data: 'test' });
  });
});
