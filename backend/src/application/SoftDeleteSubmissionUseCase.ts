import { SubmissionRepository } from '../domain/submission';
import { User, Role } from '../domain/user';

export class SoftDeleteSubmissionUseCase {
  constructor(private submissionRepository: SubmissionRepository) {}

  async execute(user: User, formIdentifier: string, submissionId: string): Promise<void> {
    if (user.role !== Role.ADMIN) {
      throw new Error('Forbidden: Only ADMIN can perform soft deletes');
    }

    await this.submissionRepository.softDelete(formIdentifier, submissionId);
  }
}
