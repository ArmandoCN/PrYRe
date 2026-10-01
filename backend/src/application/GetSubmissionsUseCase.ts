import { FormConfigRepository } from '../domain/formConfig';
import { SubmissionRepository, BaseSubmission } from '../domain/submission';

export class GetSubmissionsUseCase {
  constructor(
    private formConfigRepository: FormConfigRepository,
    private submissionRepository: SubmissionRepository
  ) {}

  async execute(formIdentifier: string): Promise<BaseSubmission[]> {
    const config = await this.formConfigRepository.findByIdentifier(formIdentifier);
    if (!config) {
      throw new Error('Form configuration not found');
    }

    return await this.submissionRepository.findMany(formIdentifier);
  }
}
