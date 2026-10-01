import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSubmissionsUseCase } from './GetSubmissionsUseCase';
import { FormConfigRepository } from '../domain/formConfig';
import { SubmissionRepository } from '../domain/submission';

describe('GetSubmissionsUseCase', () => {
  let formConfigRepository: import('vitest').Mocked<FormConfigRepository>;
  let submissionRepository: import('vitest').Mocked<SubmissionRepository>;
  let useCase: GetSubmissionsUseCase;

  beforeEach(() => {
    formConfigRepository = {
      findByIdentifier: vi.fn(),
      save: vi.fn()
    };
    submissionRepository = {
      save: vi.fn(),
      softDelete: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
    };
    useCase = new GetSubmissionsUseCase(formConfigRepository, submissionRepository);
  });

  it('should return submissions for an active form', async () => {
    formConfigRepository.findByIdentifier.mockResolvedValue({
      id: '123',
      form_identifier: 'TestForm',
      is_active: true,
      public_password: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null
    });

    const mockSubmissions = [
      { id: '1', created_at: new Date(), updated_at: new Date(), deleted_at: null, dataField: 'A' },
      { id: '2', created_at: new Date(), updated_at: new Date(), deleted_at: null, dataField: 'B' }
    ];
    submissionRepository.findMany.mockResolvedValue(mockSubmissions);

    const result = await useCase.execute('TestForm');

    expect(formConfigRepository.findByIdentifier).toHaveBeenCalledWith('TestForm');
    expect(submissionRepository.findMany).toHaveBeenCalledWith('TestForm');
    expect(result).toEqual(mockSubmissions);
  });

  it('should throw an error if the form does not exist', async () => {
    formConfigRepository.findByIdentifier.mockResolvedValue(null);

    await expect(useCase.execute('UnknownForm')).rejects.toThrow('Form configuration not found');
  });
});
