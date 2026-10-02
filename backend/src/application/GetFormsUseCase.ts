import { FormConfigRepository, FormConfig } from '../domain/formConfig';
import { User } from '../domain/user';
import { prisma } from '../infrastructure/database/prisma';

export class GetFormsUseCase {
  constructor(private formConfigRepository: FormConfigRepository) {}

  async execute(user?: User): Promise<FormConfig[]> {
    const allForms = await this.formConfigRepository.findAll();
    
    if (!user || user.role === 'SUPERADMIN') {
      return allForms;
    }

    const accessRecords = await prisma.userFormAccess.findMany({
      where: { user_id: user.id }
    });
    
    const allowedIdentifiers = accessRecords.map(a => a.form_identifier);
    return allForms.filter(f => allowedIdentifiers.includes(f.form_identifier));
  }
}
