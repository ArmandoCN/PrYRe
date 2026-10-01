import { SubmissionRepository, BaseSubmission } from '../../domain/submission';

export class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private prismaClient: any) {}

  async save(formIdentifier: string, payload: any): Promise<BaseSubmission> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    return await model.create({
      data: payload
    });
  }

  async softDelete(formIdentifier: string, submissionId: string): Promise<void> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    await model.update({
      where: { id: submissionId },
      data: { deleted_at: new Date() }
    });
  }

  async findById(formIdentifier: string, submissionId: string): Promise<BaseSubmission | null> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    return await model.findUnique({
      where: { id: submissionId, deleted_at: null }
    });
  }

  async findMany(formIdentifier: string, includeDeleted = false): Promise<BaseSubmission[]> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }

    const where = includeDeleted ? {} : { deleted_at: null };
    return await model.findMany({ where });
  }

  async count(formIdentifier: string): Promise<number> {
    const modelName = formIdentifier.charAt(0).toLowerCase() + formIdentifier.slice(1);
    const model = this.prismaClient[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found in database schema`);
    }
    return await model.count({ where: { deleted_at: null } });
  }
}
