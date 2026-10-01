import { FormConfigRepository } from '../domain/formConfig';
import { SubmissionRepository, BaseSubmission } from '../domain/submission';
import { User } from '../domain/user';
import bcrypt from 'bcrypt';

export class SubmitFormUseCase {
  constructor(
    private formConfigRepository: FormConfigRepository,
    private submissionRepository: SubmissionRepository
  ) {}

  async execute(formIdentifier: string, payload: any, user?: User, publicPassword?: string): Promise<BaseSubmission> {
    const config = await this.formConfigRepository.findByIdentifier(formIdentifier);

    if (!config) {
      throw new Error('Form configuration not found');
    }

    if (!config.is_active) {
      throw new Error('This form is currently inactive');
    }

    // If the user is a guest (not authenticated)
    if (!user) {
      if (config.public_password) {
        if (!publicPassword) {
          throw new Error('Invalid or missing public password for this form');
        }
        const isMatch = await bcrypt.compare(publicPassword, config.public_password);
        if (!isMatch) {
          throw new Error('Invalid or missing public password for this form');
        }
      }
    }

    return this.submissionRepository.save(formIdentifier, payload);
  }
}
