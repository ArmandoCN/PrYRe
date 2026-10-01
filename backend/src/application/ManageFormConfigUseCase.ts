import { FormConfigRepository, FormConfig } from '../domain/formConfig';
import { User, Role } from '../domain/user';
import bcrypt from 'bcrypt';

export class ManageFormConfigUseCase {
  constructor(private formConfigRepository: FormConfigRepository) {}

  async execute(user: User, identifier: string, updates: Partial<Pick<FormConfig, 'is_active' | 'is_listed' | 'public_password' | 'confirmation_mode'>>) {
    if (user.role !== Role.ADMIN) {
      throw new Error('Forbidden: Only ADMIN can manage form configurations');
    }

    const config = await this.formConfigRepository.findByIdentifier(identifier);
    if (!config) {
      throw new Error('Form configuration not found');
    }

    if (updates.is_active !== undefined) {
      config.is_active = updates.is_active;
    }
    
    if (updates.is_listed !== undefined) {
      config.is_listed = updates.is_listed;
    }

    if (updates.public_password !== undefined) {
      if (updates.public_password === null || updates.public_password === '') {
        config.public_password = null;
      } else {
        config.public_password = await bcrypt.hash(updates.public_password, 10);
      }
    }
    
    if (updates.confirmation_mode !== undefined) {
      config.confirmation_mode = updates.confirmation_mode;
    }

    if ('max_submissions' in updates) {
      config.max_submissions = (updates as any).max_submissions;
    }

    if ('folio_strategy' in updates) {
      config.folio_strategy = (updates as any).folio_strategy;
    }

    config.updated_at = new Date();

    await this.formConfigRepository.save(config);

    return config;
  }
}
