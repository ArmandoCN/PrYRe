import { FormConfigRepository, FormConfig } from '../domain/formConfig';

export class GetFormConfigUseCase {
  constructor(private formConfigRepository: FormConfigRepository) {}

  async execute(formIdentifier: string): Promise<FormConfig> {
    const config = await this.formConfigRepository.findByIdentifier(formIdentifier);
    if (!config) {
      throw new Error('Form configuration not found');
    }
    return config;
  }
}
